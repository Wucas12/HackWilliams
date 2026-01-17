import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { z } from 'zod';
import { SyllabusEvent, ClarificationQuestion } from '@/types/syllabus';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EventTypeSchema = z.enum(['class', 'assignment', 'exam', 'project', 'reading', 'office_hours']);

const SyllabusEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: EventTypeSchema,
  date: z.string(), // ISO date string
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  courseName: z.string().optional(), // Course name (e.g., "CS 101", "Introduction to Computer Science")
  // Recurrence fields
  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z.enum(['daily', 'weekly', 'biweekly']).optional(),
  recurrenceEndDate: z.string().optional(),
  recurrenceDaysOfWeek: z.string().optional(),
});

const SyllabusExtractionSchema = z.object({
  events: z.array(SyllabusEventSchema),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textInput = formData.get('text') as string | null;
    const clarificationsStr = formData.get('clarifications') as string | null;
    const clarifications: Record<string, string> = clarificationsStr ? JSON.parse(clarificationsStr) : {};

    // Extract text from PDF or use provided text input
    let pdfText: string = '';
    
    if (textInput && textInput.trim()) {
      // Use text input directly
      pdfText = textInput.trim();
    } else if (file) {
      // Extract text from PDF using pdf-parse
      // If parsing fails (corrupted PDF, bad XRef, etc.), return empty events gracefully
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdfParse(buffer);
        pdfText = pdfData.text || '';
      } catch (pdfError) {
        // PDF parsing failed - cannot extract text (corrupted PDF, bad XRef, etc.)
        // Silently return empty events - this is expected behavior for unparseable PDFs
        return NextResponse.json({
          events: [],
        });
      }
      
      // If PDF text extraction failed or is empty, return empty events
      if (!pdfText || pdfText.trim().length === 0) {
        console.warn('PDF appears to be empty or contains no extractable text - returning empty events');
        return NextResponse.json({
          events: [],
        });
      }
    } else {
      return NextResponse.json(
        { error: 'No file or text input provided' },
        { status: 400 }
      );
    }

    // Define schema for OpenAI structured outputs
    // Strict mode requires: all properties in required array, additionalProperties: false on ALL objects
    // We include all fields in required to satisfy strict mode; Zod validates optional fields
    const jsonSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string', enum: ['class', 'assignment', 'exam', 'project', 'reading', 'office_hours'] },
              date: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              courseName: { type: 'string' },
              isRecurring: { type: 'boolean' },
              recurrenceFrequency: { type: 'string', enum: ['daily', 'weekly', 'biweekly'] },
              recurrenceEndDate: { type: 'string' },
              recurrenceDaysOfWeek: { type: 'string' },
            },
            required: ['id', 'title', 'type', 'date', 'startTime', 'endTime', 'location', 'description', 'courseName', 'isRecurring', 'recurrenceFrequency', 'recurrenceEndDate', 'recurrenceDaysOfWeek'],
          },
        },
      },
      required: ['events'],
    };

    // Use OpenAI to extract structured data
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0, // Deterministic outputs for consistency
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting syllabus information from text. 
          Extract all class sessions, assignments, exams, projects, and office hours.
          
          EVENT TYPE CLASSIFICATION:
          - "assignment": Individual homework assignments, problem sets, or graded assignments
          - "exam": Tests, quizzes, midterms, final exams, or any examination
          - "project": Long-term projects, group projects, or major assignments
          - "reading": Required readings, textbook chapters, articles, or reading assignments with due dates
          - "class": Regular class sessions or lectures
          - "office_hours": Professor or TA office hours
          
          READING MATERIALS EXTRACTION:
          - For events of type "reading", extract all reading materials (books, chapters, articles, papers) into the description field
          - Format: Include book titles, chapter numbers, page ranges, article titles, authors
          - Examples: "Read Chapter 3 (pp. 45-67) of 'Introduction to Computer Science'", "Required: 'The Art of Programming' by Author Name, Chapters 1-2"
          
          CRITICAL DATE REQUIREMENTS:
          - All dates are in North America timezone context
          - Extract dates EXACTLY as written in the syllabus text
          - Return dates in ISO format (YYYY-MM-DD) - date only, no time component
          - Use the ACTUAL 4-digit year number (e.g., 2023, 2024, 2025), NOT the literal text "YYYY"
          - Extract the year from the syllabus text context (course term, semester dates, academic year)
          - Do NOT use placeholder text like "YYYY" - always use the actual year number
          - Do NOT apply any timezone conversions or date shifts
          - Verify dates match the source text exactly before returning
          - Dates should be the calendar date as written in North America context, not a day before or after
          
          EXAMPLES OF CORRECT DATE EXTRACTION:
          
          Input: "Final Exam: June 1, 2023 at 11:00 AM"
          Output date: "2023-06-01" (NOT "YYYY-06-01" or "2023-05-31")
          
          Input: "Class Session: March 6, 2023, Monday 8:00 AM"
          Output date: "2023-03-06" (NOT "YYYY-03-DD" or "2023-03-05")
          
          Input: "Midterm Exam: May 31, 2023 at 2:00 PM"
          Output date: "2023-05-31" (NOT "YYYY-05-31" or "2023-06-01")
          
          Input: "Regular Class: April 3, 2023"
          Output date: "2023-04-03" (use actual year 2023, NOT "YYYY")
          
          COURSE NAME EXTRACTION:
          - Extract the course name/code from the syllabus (e.g., "CS 101", "MATH 201", "Introduction to Computer Science", "Biology 101")
          - Look for course identifiers at the top of the syllabus, in the header, or in course information sections
          - If the syllabus covers multiple sections, extract the general course name WITHOUT section identifiers
          - For general syllabi covering all sections, use the base course name (e.g., "CS 101" not "CS 101 Section A")
          - Include course name in the courseName field for all events (same value for all events from same syllabus)
          - Examples: "CS 101: Introduction to Computer Science" → courseName: "CS 101"
                      "MATH 201 - Sections A, B, C" → courseName: "MATH 201"
          
          MULTI-SECTION SYLLABI HANDLING:
          - If the syllabus applies to multiple sections, extract events as general events that apply to ALL sections
          - Do NOT create separate events for each section unless the syllabus explicitly lists section-specific events
          - If events are section-specific, include section info in the title (e.g., "Section A: Midterm Exam")
          - Most syllabi are general and apply to all sections - extract events once, not per section
          
          AMBIGUITY HANDLING:
          - If you encounter ambiguous information (e.g., multiple course sections, unclear dates, conflicting information), extract what you can with confidence
          - Note ambiguities will be handled by the system - focus on extracting clear information
          
          TITLE REQUIREMENTS:
          - Extract SPECIFIC, descriptive titles for each event (e.g., "Homework 1", "Midterm Exam", "Final Exam", "Project Proposal")
          - Do NOT use generic titles like "Class", "Assignment", or just the course name
          - Use descriptive names that identify the specific assignment, exam, or project
          - Examples: "Homework 1: Problem Set 1", "Midterm Exam", "Final Project: Research Paper", "Quiz 2"
          
          RECURRING EVENTS (REPETITIVE EVENTS):
          - IMPORTANT: For events that repeat regularly (especially classes, office hours), extract them as RECURRING events
          - Classes that meet "every Monday and Wednesday", "MWF", "Tuesdays and Thursdays", or similar patterns should be marked as recurring
          - Office hours that repeat weekly should be marked as recurring
          - For recurring events:
            1. Set isRecurring to true
            2. Set recurrenceFrequency based on pattern:
               - "daily" for events that occur every day
               - "weekly" for events that occur weekly (most common for classes)
               - "biweekly" for events that occur every other week
            3. Set recurrenceEndDate to the last date the event occurs (e.g., end of semester, final exam date, or date when class ends)
               - Use ISO format (YYYY-MM-DD) - extract from syllabus (semester end date, final exam date, or last class date)
            4. Set recurrenceDaysOfWeek to the days it repeats:
               - Format as comma-separated day names: "Monday, Wednesday, Friday" or "MWF" or "Tuesday, Thursday"
               - Examples: "Monday, Wednesday, Friday" for MWF classes, "Tuesday, Thursday" for TTh classes
            5. Set date to the FIRST occurrence date of the recurring event
          - For NON-RECURRING events (one-time assignments, exams, projects):
            1. Set isRecurring to false
            2. Set recurrenceFrequency to empty string ""
            3. Set recurrenceEndDate to empty string ""
            4. Set recurrenceDaysOfWeek to empty string ""
          - EXAMPLES OF RECURRING EVENTS:
            Input: "Class meets every Monday and Wednesday from 2:00-3:30 PM starting January 15, 2023 until May 10, 2023"
            Output: {
              isRecurring: true,
              recurrenceFrequency: "weekly",
              recurrenceEndDate: "2023-05-10",
              recurrenceDaysOfWeek: "Monday, Wednesday",
              date: "2023-01-15" // First occurrence
            }
            
            Input: "Office Hours: Tuesdays 3:00-5:00 PM throughout the semester (ends May 12, 2023)"
            Output: {
              isRecurring: true,
              recurrenceFrequency: "weekly",
              recurrenceEndDate: "2023-05-12",
              recurrenceDaysOfWeek: "Tuesday",
              date: "2023-01-17" // First Tuesday (or closest start date)
            }
          
          - CRITICAL: When you see patterns like "MWF", "TTh", "Monday/Wednesday/Friday", "Classes meet on Tuesdays and Thursdays", or "Weekly classes", 
            you MUST extract them as recurring events, NOT as individual events for each occurrence.
          
          Extract times in 24-hour format (HH:MM) if provided (e.g., "11:00 AM" → "11:00", "2:00 PM" → "14:00").
          Generate unique IDs for each event (e.g., "homework-1", "midterm-exam-1", "final-project-1", "class-mwf-recurring"). 
          Include all fields: id (required), title (required, must be specific), type (required), date (required),
          startTime (use empty string "" if not available), endTime (use "" if not available),
          location (use "" if not available), description (use "" if not available), courseName (use empty string "" if not found).
          For recurrence fields: isRecurring (use false if not recurring, true if recurring), 
          recurrenceFrequency (use empty string "" if not recurring, otherwise "daily", "weekly", or "biweekly"),
          recurrenceEndDate (use empty string "" if not recurring, otherwise ISO date YYYY-MM-DD),
          recurrenceDaysOfWeek (use empty string "" if not recurring, otherwise comma-separated day names like "Monday, Wednesday, Friday").
          
          EXTRACTION MODE:
          - If the input text mentions "Extract only ONE event" or similar instruction, extract EXACTLY ONE event (the most important/main event)
          - Otherwise, extract all events found in the text
          - For single event extraction, prioritize the first/main event mentioned`,
        },
        {
          role: 'user',
          content: clarifications && Object.keys(clarifications).length > 0
            ? `${pdfText.toLowerCase().includes('extract only one event') ? 'Extract only ONE event from' : 'Extract all events from'} this ${textInput && textInput.trim() ? 'text' : 'syllabus'}:\n\n${pdfText}\n\nUser Clarifications:\n${Object.entries(clarifications).map(([id, answer]) => `- ${answer}`).join('\n')}\n\nCRITICAL INSTRUCTIONS FOR CLARIFICATIONS:\n- If a clarification mentions a time (e.g., "4pm", "4:00 PM"), determine if it's asking about START TIME or END TIME based on the original question context\n- If the clarification is about an ENDING TIME or END TIME, assign it to the endTime field\n- If the clarification is about a START TIME, assign it to the startTime field\n- PRESERVE the original startTime that was extracted (e.g., "2pm") unless the clarification explicitly states to change the start time\n- When setting endTime from a clarification, keep the original startTime unchanged unless told otherwise\n- Example: If original extraction had startTime "14:00" (2pm) and clarification says "ending at 4pm", then endTime should be "16:00" (4pm) and startTime should remain "14:00" (2pm)\n\nPlease use these clarifications to refine your extraction while preserving correctly extracted times.`
            : `${pdfText.toLowerCase().includes('extract only one event') ? 'Extract only ONE event from' : 'Extract all events from'} this ${textInput && textInput.trim() ? 'text' : 'syllabus'}:\n\n${pdfText}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'syllabus_extraction',
          strict: true,
          schema: jsonSchema,
        },
      },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to extract content from LLM response' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    const validated = SyllabusExtractionSchema.parse(parsed);
    let events: SyllabusEvent[] = validated.events;
    
    // If text input indicates single event extraction, only keep the first event
    if (textInput && textInput.trim() && textInput.toLowerCase().includes('extract only one event')) {
      events = events.slice(0, 1); // Only take the first event
    }

    // Normalize courseName across all events (use most common non-empty value)
    if (events.length > 0) {
      const courseNameMap = new Map<string, number>();
      events.forEach(event => {
        const courseName = event.courseName?.trim();
        if (courseName && courseName !== '') {
          courseNameMap.set(courseName, (courseNameMap.get(courseName) || 0) + 1);
        }
      });
      
      // Find most common course name
      let mostCommonCourseName = '';
      let maxCount = 0;
      courseNameMap.forEach((count, name) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonCourseName = name;
        }
      });
      
      // Apply normalized course name to all events
      if (mostCommonCourseName) {
        events = events.map(event => ({
          ...event,
          courseName: mostCommonCourseName,
        }));
      }
    }

    // Post-processing validation: Ensure dates are valid and log for debugging
    events = events.map((event) => {
      const dateStr = event.date;
      
      // Validate date format (YYYY-MM-DD) - must be 4 digits, 2 digits, 2 digits
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        console.warn(`Invalid date format for event "${event.title}": ${dateStr}. Expected format: YYYY-MM-DD with actual numbers.`);
        return null; // Filter out invalid dates
      }
      
      // Validate date is actually valid (e.g., not 2024-13-45)
      const dateObj = new Date(dateStr + 'T00:00:00');
      if (isNaN(dateObj.getTime())) {
        console.warn(`Invalid date value for event "${event.title}": ${dateStr}`);
        return null; // Filter out invalid dates
      }
      
      return event;
    }).filter((event): event is SyllabusEvent => event !== null); // Remove null entries

    // Generate clarification questions on first pass
    // Only ask questions if clarifications weren't provided (first pass)
    const questions: ClarificationQuestion[] = [];
    
    // Check if input is text (custom event) or file (syllabus)
    const isTextInput = textInput && textInput.trim();
    
    if (!clarifications || Object.keys(clarifications).length === 0) {
      // Only ask about sections for PDF files (syllabi), not for custom text input
      if (!isTextInput) {
        questions.push({
          id: 'sections-applicability',
          question: 'Do these events apply to a specific section, or are they general events that apply to all sections? If specific, please specify which section (e.g., "Section A", "Section B", or "All sections").',
          field: 'section',
          context: 'This helps ensure events are correctly associated with the right course section.',
        });
      }
      
      // Ask OpenAI to analyze potential confusions and generate ONE clarification question
      try {
        const confusionAnalysisSchema = {
          type: 'object',
          additionalProperties: false,
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: { type: 'string' },
                  question: { type: 'string' },
                  field: { type: 'string', enum: ['courseName', 'date', 'section', 'other'] },
                  context: { type: 'string' },
                },
                required: ['id', 'question', 'field', 'context'],
              },
            },
          },
          required: ['questions'],
        };

        const confusionAnalysis = await openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: `You are analyzing a syllabus extraction to generate clarification questions for the user.

Always generate at least ONE clarification question. Even if the extraction seems complete, ask about something that could be confirmed or made more specific, such as:
- Missing end time (if only start time is provided)
- Course name confirmation
- Date verification
- Location details
- Any potentially ambiguous information

Focus on questions that will help ensure accuracy. If endTime is missing but startTime exists, ask about the end time. If courseName is missing, ask about it. If multiple events exist, ask about something common to all or the most important event.

Each question should have:
- id: unique identifier (e.g., "end-time-1", "course-name-1", "date-confirm-1")
- question: clear, specific question for the user
- field: category ("courseName", "date", "section", or "other")
- context: brief context about why this needs clarification (use empty string "" if no additional context needed)

ALWAYS return exactly one question - never an empty array.`,
            },
            {
              role: 'user',
              content: `Extracted events:\n${JSON.stringify(events, null, 2)}\n\nOriginal syllabus text (first 2000 chars):\n${pdfText.substring(0, 2000)}\n\nGenerate ONE clarification question about this extraction. Even if the extraction seems clear, ask about something that could be made more specific or confirmed (e.g., missing end time, course name confirmation, date verification, etc.). Always return exactly one question.`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'confusion_analysis',
              strict: true,
              schema: confusionAnalysisSchema,
            },
          },
        });

        const confusionContent = confusionAnalysis.choices[0].message.content;
        if (confusionContent) {
          const parsedConfusion = JSON.parse(confusionContent);
          if (parsedConfusion.questions && Array.isArray(parsedConfusion.questions) && parsedConfusion.questions.length > 0) {
            // Only add the first (most important) question
            questions.push(parsedConfusion.questions[0]);
          } else {
            // Fallback: generate a default question if LLM returns empty
            if (events.length > 0) {
              const event = events[0];
              if (!event.endTime && event.startTime) {
                questions.push({
                  id: 'end-time-default',
                  question: `What time does "${event.title}" end? (Currently only start time "${event.startTime}" is specified)`,
                  field: 'other',
                  context: `Event: ${event.title}`,
                });
              } else if (!event.courseName) {
                questions.push({
                  id: 'course-name-default',
                  question: `What is the course name for "${event.title}"?`,
                  field: 'courseName',
                  context: `Event: ${event.title}`,
                });
              } else {
                questions.push({
                  id: 'general-confirm-default',
                  question: `Please confirm the details for "${event.title}" - is everything correct? (Date: ${event.date}, Time: ${event.startTime || 'not specified'})`,
                  field: 'other',
                  context: `Event: ${event.title}`,
                });
              }
            }
          }
        } else {
          // Fallback if LLM response is empty
          if (events.length > 0) {
            const event = events[0];
            questions.push({
              id: 'fallback-question',
              question: `Please confirm: Is "${event.title}" scheduled for ${event.date} at ${event.startTime || 'time not specified'}?`,
              field: 'other',
              context: '',
            });
          }
        }
      } catch (confusionError) {
        console.error('Error analyzing confusions with OpenAI:', confusionError);
        // Continue without confusion-based questions if this fails
      }
    }

    // Save extracted JSON to file
    try {
      const extractionsDir = join(process.cwd(), 'data', 'extractions');
      await mkdir(extractionsDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `extraction-${timestamp}.json`;
      const filepath = join(extractionsDir, filename);
      
      const extractionData = {
        extractedAt: new Date().toISOString(),
        sourceFile: file ? file.name : 'text-input',
        events,
      };
      
      await writeFile(filepath, JSON.stringify(extractionData, null, 2), 'utf-8');
    } catch (fileError) {
      console.error('Error saving extraction file:', fileError);
      // Don't fail the request if file saving fails
    }

    return NextResponse.json({
      events,
      needsClarification: questions.length > 0,
      questions: questions.length > 0 ? questions : undefined,
    });
  } catch (error) {
    console.error('Error processing syllabus:', error);
    return NextResponse.json(
      { error: 'Failed to process syllabus', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

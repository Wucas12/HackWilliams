import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { MeetingDetails } from '@/types/meeting';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MeetingDetailsSchema = z.object({
  title: z.string(),
  duration: z.number(), // Duration in minutes
  preferredTime: z.object({
    date: z.string().optional(), // ISO date string (YYYY-MM-DD)
    time: z.string().optional(), // HH:MM format
    timeWindow: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
  }).optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const naturalLanguage = body.naturalLanguage as string;

    if (!naturalLanguage || !naturalLanguage.trim()) {
      return NextResponse.json(
        { error: 'Natural language description is required' },
        { status: 400 }
      );
    }

    // Define schema for OpenAI structured outputs
    const jsonSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        duration: { type: 'number' },
        preferredTime: {
          type: 'object',
          additionalProperties: false,
          properties: {
            date: { type: 'string' },
            time: { type: 'string' },
            timeWindow: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'any'] },
          },
          required: ['date', 'time', 'timeWindow'],
        },
        description: { type: 'string' },
      },
      required: ['title', 'duration', 'preferredTime', 'description'],
    };

    // Use OpenAI to parse meeting details from natural language
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are an expert at parsing natural language meeting requests into structured data.

          EXTRACTION REQUIREMENTS:
          - Extract a clear, concise meeting title/subject (e.g., "Coffee Chat", "Project Sync", "Team Review")
          - Extract duration in minutes (default to 30 if not specified)
          - Extract preferred time if mentioned:
            * Date: Use ISO format (YYYY-MM-DD). If relative (e.g., "next Monday", "tomorrow"), calculate the actual date based on today's date context. Use empty string "" if not specified.
            * Time: Use 24-hour format (HH:MM). MUST be within reasonable business hours (6 AM - 10 PM). If user mentions times outside this range, adjust to the nearest reasonable time (e.g., 2 AM → 9 AM, 11:30 PM → 5 PM). Use empty string "" if not specified.
            * Time window: "morning" (9 AM - 12 PM), "afternoon" (1 PM - 5 PM), "evening" (5 PM - 8 PM), or "any". Use "any" if not specified.
          - Extract description/notes (use empty string "" if none)
          
          TIME VALIDATION:
          - NEVER extract times before 6:00 AM or after 10:00 PM (22:00)
          - If user mentions absurd times (e.g., "2 AM", "midnight", "11:30 PM"), adjust to reasonable hours:
            * Very early (before 6 AM) → use 9:00 (morning start)
            * Very late (after 10 PM) → use 17:00 (5 PM, reasonable end of business day)
          
          EXAMPLES:
          Input: "Coffee chat next Monday afternoon"
          Output: {
            title: "Coffee Chat",
            duration: 30,
            preferredTime: { date: "2026-01-20", time: "", timeWindow: "afternoon" },
            description: ""
          }
          
          Input: "30-minute project sync on Wednesday at 2pm"
          Output: {
            title: "Project Sync",
            duration: 30,
            preferredTime: { date: "2026-01-22", time: "14:00", timeWindow: "afternoon" },
            description: ""
          }
          
          Input: "Quick team review meeting"
          Output: {
            title: "Team Review",
            duration: 30,
            preferredTime: { date: "", time: "", timeWindow: "any" },
            description: ""
          }
          
          For relative dates (e.g., "next week", "tomorrow", "Monday"), calculate based on the current date context.
          Default duration is 30 minutes if not specified.`,
        },
        {
          role: 'user',
          content: `Parse this meeting request into structured data: "${naturalLanguage}"`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'meeting_details',
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
    const validated = MeetingDetailsSchema.parse(parsed);

    // Validate and normalize times to reasonable hours (6 AM - 10 PM)
    const MIN_HOUR = 6; // 6 AM
    const MAX_HOUR = 22; // 10 PM (22:00 in 24-hour format)

    if (validated.preferredTime?.time) {
      const [hours, minutes] = validated.preferredTime.time.split(':').map(Number);
      const hour = hours || 0;
      
      // If time is outside reasonable hours, adjust it or remove it
      if (hour < MIN_HOUR || hour >= MAX_HOUR) {
        // If it's too early, set to 9 AM (morning start)
        if (hour < MIN_HOUR) {
          validated.preferredTime.time = '09:00';
        } 
        // If it's too late, set to 5 PM (evening start, but still reasonable)
        else if (hour >= MAX_HOUR) {
          validated.preferredTime.time = '17:00';
        }
      }
    }

    // If preferredTime has all empty strings, make it optional
    const meetingDetails: MeetingDetails = {
      title: validated.title,
      duration: validated.duration,
      ...(validated.preferredTime?.date || validated.preferredTime?.time || validated.preferredTime?.timeWindow !== 'any'
        ? { preferredTime: validated.preferredTime }
        : {}),
      ...(validated.description ? { description: validated.description } : {}),
    };

    return NextResponse.json(meetingDetails);
  } catch (error) {
    console.error('Error parsing meeting request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse meeting request' },
      { status: 500 }
    );
  }
}

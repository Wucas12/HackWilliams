import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { MeetingDetails, TimeSlot } from '@/types/meeting';
import { getCurrentUserProfile, getPersonNameByEmail, type GoogleUserProfile } from '@/lib/google-oauth-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingDetails, selectedSlot, attendeeEmail, tone }: {
      meetingDetails: MeetingDetails;
      selectedSlot: TimeSlot;
      attendeeEmail: string;
      tone: 'formal' | 'friendly';
    } = body;

    if (!meetingDetails || !selectedSlot || !attendeeEmail || !tone) {
      return NextResponse.json(
        { error: 'Meeting details, selected slot, attendee email, and tone are required' },
        { status: 400 }
      );
    }

    // Fetch current user's name from Google for signing the invitation
    const profile: GoogleUserProfile = await getCurrentUserProfile().catch(() => ({}));
    const senderName = profile.name || [profile.givenName, profile.familyName].filter(Boolean).join(' ') || undefined;

    // Fetch attendee's name from Google People API
    const attendeeName = await getPersonNameByEmail(attendeeEmail).catch(() => undefined);

    // Format date and time for the invitation
    const startDateTime = new Date(selectedSlot.startTime);
    const endDateTime = new Date(selectedSlot.endTime);
    
    // Validate dates
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date/time in selected slot' },
        { status: 400 }
      );
    }
    
    const formattedDate = startDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const formattedStartTime = startDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    const formattedEndTime = endDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // System prompt: academic-professional (formal) or friendly
    const formalSystemPrompt = `You are generating short calendar-invite descriptions intended for university professors or academic staff.

The tone must reflect academic professionalism:
- Polite
- Respectful of time
- Clear and restrained
- Never casual or corporate
- Never promotional or enthusiastic

=====================
TONE REQUIREMENTS
=====================

Use an ACADEMIC-PROFESSIONAL tone.

Language rules:
- Use full sentences
- Avoid slang, emojis, exclamation marks, or sales language
- Avoid corporate phrasing (e.g., "touch base," "sync," "circle back")
- Avoid casual language (e.g., "chat," "catch up")
- Do not use overly formal legal language

Preferred academic phrasing:
- "I would like to meet to discuss…"
- "This meeting is scheduled for…"
- "Thank you for your time."
- "I appreciate your availability."
- "I look forward to speaking with you."

=====================
GREETING RULES
=====================

If the professor's/attendee's name is known (provided in attendee name):
- "Dear Professor [Last Name]," or "Dear [Full Name],"

If unknown:
- "Dear Professor," or "Dear [Name]," (use the attendee name if provided)

Use the attendee name provided in the meeting details. If a full name is provided, you may use the last name for formal greetings or the full name if appropriate.

=====================
CONTENT REQUIREMENTS
=====================

The message MUST include:

- A respectful greeting
- The purpose or meeting title
- The full date
- The start and end time
- The duration in minutes
- A short description if provided
- A polite academic closing
- A sign-off (e.g. "Kind regards,") followed by the sender's full name on the next line. Use the Sender name provided in the meeting details.

=====================
FORMAT RULES
=====================

- 2–4 sentences total
- Plain text only
- No bullet points
- No markdown
- No emojis
- No labels such as "Date:" or "Time:"
- Suitable for Google Calendar description fields

=====================
OUTPUT EXAMPLE
=====================

Dear Professor Smith,

I would like to meet to discuss course planning and next steps on Tuesday, February 6 from 1:30–2:00 PM (30 minutes). Thank you very much for your time, and I look forward to speaking with you.

Kind regards,
[Sender Full Name]

(Use the Sender name from the meeting details to replace [Sender Full Name].)

=====================
TASK
=====================

Generate a complete professor-appropriate calendar invitation message using the meeting details provided.`;

    const friendlySystemPrompt = `You are an expert at writing professional meeting invitation messages for calendar invites.

TONE REQUIREMENTS:
- FRIENDLY TONE: Use warm, approachable language. Address recipients casually (e.g., "Hi [Name]," or just start with the message). Use friendly phrases like "Let us meet", "Would love to chat", "Looking forward to".

MESSAGE STRUCTURE:
- Start with a greeting appropriate to the tone - use the attendee's name if provided (e.g., "Hi [Name]," or "Hi there,")
- Mention the meeting title/purpose
- Ask if the recipient is available
- Include date, start time, and end time clearly
- Mention duration if relevant
- Add a brief description if provided
- Close with a friendly closing and the sender's name (use the Sender name from the meeting details)
- Keep the message concise (2-4 sentences) - it will appear in a calendar invite description

EXAMPLE FRIENDLY:
"Hi [Attendee Name],

Let's meet for [Meeting Title] on [Date] at [Time] ([Duration] minutes)! [Description if provided]

Looking forward to catching up!
[Sender Name]"

Use the attendee name provided in the meeting details in the greeting.

Generate a complete invitation message based on the meeting details provided.`;

    const systemContent = tone === 'formal' ? formalSystemPrompt : friendlySystemPrompt;

    // Generate invitation message using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: `Generate a ${tone} invitation message for:

Meeting Title: ${meetingDetails.title}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime}
Duration: ${meetingDetails.duration} minutes
Attendee Email: ${attendeeEmail}
Attendee Name: ${attendeeName || 'not provided (use generic greeting)'}
Sender name (sign the invitation with this name): ${senderName || 'not provided'}
${meetingDetails.description ? `Description: ${meetingDetails.description}` : ''}

Generate the invitation message. Use the attendee's name in the greeting if provided.`,
        },
      ],
    });

    const message = completion.choices[0].message.content;
    if (!message) {
      return NextResponse.json(
        { error: 'Failed to generate invitation message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: message.trim() });
  } catch (error) {
    console.error('Error generating invitation message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate invitation message' },
      { status: 500 }
    );
  }
}

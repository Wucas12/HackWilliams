'use server';

import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { SyllabusEvent, CalendarStressAnalysis } from '@/types/syllabus';

async function getAuthenticatedOAuth2Client() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    throw new Error('Not authenticated. Please log in with Google.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken || undefined,
  });

  // The googleapis library will auto-refresh if we provide both tokens
  // But we can proactively refresh if access token is missing
  if (refreshToken && !accessToken) {
    await ensureValidToken(oauth2Client, cookieStore);
  }

  return oauth2Client;
}

// Helper to refresh token with retry logic
async function ensureValidToken(oauth2Client: any, cookieStore: any) {
  const refreshToken = cookieStore.get('google_refresh_token')?.value;
  
  if (!refreshToken) {
    return; // No refresh token available
  }

  try {
    // Try to refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (credentials.access_token) {
      // Update access token cookie
      cookieStore.set('google_access_token', credentials.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      oauth2Client.setCredentials(credentials);
    }
  } catch (refreshError) {
    console.error('Error refreshing access token:', refreshError);
    // Don't throw here - let the API call fail and we'll handle it
  }
}

export async function syncToCalendar(events: SyllabusEvent[]) {
  try {
    const cookieStore = await cookies();
    let oauth2Client = await getAuthenticatedOAuth2Client();
    let calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const results = [];

    for (const event of events) {
      const startDateTime = event.startTime
        ? `${event.date}T${event.startTime}:00`
        : `${event.date}T09:00:00`;
      
      const endDateTime = event.endTime
        ? `${event.date}T${event.endTime}:00`
        : event.startTime
        ? `${event.date}T${addHour(event.startTime)}:00`
        : `${event.date}T10:00:00`;

      // Format event type for description
      const formatEventType = (type: string): string => {
        const typeMap: Record<string, string> = {
          class: 'Regular Class',
          assignment: 'Assignment',
          exam: 'Exam',
          project: 'Project',
          reading: 'Reading',
          office_hours: 'Office Hours',
        };
        return typeMap[type] || type;
      };

      // Color code events (Google Calendar colorId: 10=green, 5=yellow, 11=red)
      const getEventColor = (type: string): string | undefined => {
        const colorMap: Record<string, string> = {
          assignment: '10', // Green
          exam: '5', // Yellow
          project: '11', // Red
        };
        return colorMap[type];
      };

      // Build description with event type clearly stated
      const eventTypeLabel = formatEventType(event.type);
      const descriptionParts = [`Type: ${eventTypeLabel}`];
      
      // For reading events, highlight reading materials prominently
      if (event.type === 'reading' && event.description) {
        descriptionParts.push(`📚 Reading Materials:\n${event.description}`);
      } else if (event.description) {
        descriptionParts.push(event.description);
      }
      
      if (event.courseName && event.courseName.trim()) {
        descriptionParts.push(`Course: ${event.courseName}`);
      }

      // Format title as "Course Name: Event Title" (e.g., "CS 101: Homework 1")
      const calendarTitle = (event.courseName && event.courseName.trim())
        ? `${event.courseName}: ${event.title}`
        : event.title;

      const calendarEvent: any = {
        summary: calendarTitle, // Specific event title (e.g., "Homework 1", "Final Exam")
        description: descriptionParts.join('\n\n'), // Event type and details in description
        location: event.location || '',
        start: {
          dateTime: startDateTime,
          timeZone: 'America/New_York', // Adjust as needed
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/New_York',
        },
      };

      // Add color coding for assignment (green), exam (yellow), project (red)
      const colorId = getEventColor(event.type);
      if (colorId) {
        calendarEvent.colorId = colorId;
      }

      // Try to insert event, refresh token if we get auth error
      let response;
      try {
        response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: calendarEvent,
        });
      } catch (apiError: any) {
        // If we get an auth error, try refreshing token
        if (apiError.code === 401 || apiError.message?.includes('Invalid Credentials')) {
          const refreshToken = cookieStore.get('google_refresh_token')?.value;
          if (refreshToken) {
            await ensureValidToken(oauth2Client, cookieStore);
            // Recreate calendar client with refreshed token
            oauth2Client = await getAuthenticatedOAuth2Client();
            calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            // Retry the insert with refreshed token
            response = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: calendarEvent,
            });
          } else {
            throw new Error('Access token expired and no refresh token available. Please log in again.');
          }
        } else {
          throw apiError;
        }
      }

      results.push({
        id: event.id,
        calendarEventId: response.data.id,
        success: true,
      });
    }

    return {
      success: true,
      synced: results.length,
      results,
    };
  } catch (error) {
    console.error('Error syncing to calendar:', error);
    throw new Error(
      `Failed to sync to calendar: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function addHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const newHours = (hours + 1) % 24;
  return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export async function analyzeCalendarStress(totalDays: number = 28): Promise<CalendarStressAnalysis> {
  try {
    // Validate and clamp totalDays
    const days = Math.max(1, Math.min(365, Math.round(totalDays))); // Between 1 and 365 days

    const oauth2Client = await getAuthenticatedOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Calculate date range based on user input
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    // Fetch events from Google Calendar for the selected time frame
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Group events by date
    const eventsByDate = new Map<string, number>();
    
    for (const event of events) {
      if (event.start?.dateTime || event.start?.date) {
        const startDate = event.start.dateTime || event.start.date;
        if (startDate) {
          const dateStr = startDate.split('T')[0]; // Get YYYY-MM-DD
          eventsByDate.set(dateStr, (eventsByDate.get(dateStr) || 0) + 1);
        }
      }
    }

    // Calculate average events per day
    const totalEvents = events.length;
    const averageEventsPerDay = totalEvents / totalDays;

    // Identify high stress days (>7 events) and high stress period (>5 average per day)
    const highStressDays: CalendarStressAnalysis['highStressDays'] = [];
    const isHighStressWeek = averageEventsPerDay > 5;

    // Create calendar events for high stress days and collect their IDs
    for (const [dateStr, eventCount] of eventsByDate.entries()) {
      if (eventCount > 7) {
        try {
          // Create a calendar event for this high stress day
          const stressEventDate = new Date(dateStr + 'T09:00:00');
          const endDate = new Date(dateStr + 'T10:00:00');

          const stressEvent = {
            summary: `⚠️ High Stress Day - ${eventCount} events`,
            description: `This day has ${eventCount} events scheduled. Make sure to plan ahead!`,
            start: {
              dateTime: stressEventDate.toISOString(),
              timeZone: 'America/New_York',
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'America/New_York',
            },
            colorId: '11', // Red color
          };

          const insertResponse = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: stressEvent,
          });

          highStressDays.push({
            date: dateStr,
            eventCount,
            calendarEventId: insertResponse.data.id || undefined,
          });
        } catch (error) {
          console.error(`Error creating stress event for ${dateStr}:`, error);
          // Still add to list even if calendar event creation fails
          highStressDays.push({
            date: dateStr,
            eventCount,
          });
        }
      }
    }

    return {
      isHighStressWeek,
      averageEventsPerDay,
      highStressDays,
      totalDays: days,
    };
  } catch (error) {
    console.error('Error analyzing calendar stress:', error);
    throw new Error(
      `Failed to analyze calendar stress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

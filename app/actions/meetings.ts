'use server';

import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { MeetingDetails, TimeSlot, MeetingBookingResponse } from '@/types/meeting';

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

  // Try to refresh token if we have a refresh token
  if (refreshToken && !accessToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
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
      throw new Error('Failed to refresh access token. Please log in again.');
    }
  }

  return oauth2Client;
}

// Get the current user's email from their calendar
async function getCurrentUserEmail(): Promise<string> {
  try {
    const oauth2Client = await getAuthenticatedOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Get calendar settings to get the user's email
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);
    return primaryCalendar?.id || '';
  } catch (error) {
    console.error('Error getting user email:', error);
    throw new Error('Failed to get user email');
  }
}

export async function findAvailableSlots(
  attendeeEmail: string,
  duration: number,
  timeRange: { start: Date; end: Date },
  meetingDetails?: MeetingDetails
): Promise<TimeSlot[]> {
  try {
    const oauth2Client = await getAuthenticatedOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Get current user's email
    const organizerEmail = await getCurrentUserEmail();
    if (!organizerEmail) {
      throw new Error('Failed to get organizer email from calendar');
    }
    
    // Use FreeBusy API to check availability
    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeRange.start.toISOString(),
        timeMax: timeRange.end.toISOString(),
        items: [
          { id: organizerEmail },
          { id: attendeeEmail },
        ],
      },
    });

    const calendarBusy = freebusyResponse.data.calendars || {};
    const organizerBusy = calendarBusy[organizerEmail]?.busy || [];
    const attendeeBusy = calendarBusy[attendeeEmail]?.busy || [];

    // Combine busy periods from both calendars
    const allBusyPeriods = [...organizerBusy, ...attendeeBusy]
      .map(period => ({
        start: new Date(period.start || ''),
        end: new Date(period.end || ''),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Find available slots (gaps between busy periods)
    const availableSlots: TimeSlot[] = [];
    const durationMs = duration * 60 * 1000; // Convert minutes to milliseconds
    
    // Start checking from the beginning of time range
    let currentTime = new Date(timeRange.start);
    
    // Set to reasonable business hours (6 AM - 10 PM absolute limits, 9 AM - 8 PM preferred)
    const absoluteMinHour = 6; // 6 AM - absolute minimum
    const absoluteMaxHour = 22; // 10 PM (22:00) - absolute maximum
    const businessHoursStart = 9; // 9 AM - preferred start
    const businessHoursEnd = 20; // 8 PM (20:00) - preferred end (for evening window)
    const defaultBusinessHoursEnd = 17; // 5 PM - default end
    
    // Adjust start time to reasonable hours - enforce absolute minimum
    const currentHour = currentTime.getHours();
    if (currentHour < absoluteMinHour) {
      // Too early - move to 9 AM (business hours start)
      currentTime.setHours(businessHoursStart, 0, 0, 0);
    } else if (currentHour >= absoluteMaxHour) {
      // Too late - move to next day at 9 AM
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(businessHoursStart, 0, 0, 0);
    }

    // Check for preferred time window from meeting details
    let preferredTimeWindow: 'morning' | 'afternoon' | 'evening' | 'any' = 'any';
    if (meetingDetails?.preferredTime?.timeWindow) {
      preferredTimeWindow = meetingDetails.preferredTime.timeWindow;
    }

    while (currentTime.getTime() + durationMs <= timeRange.end.getTime()) {
      // Skip weekends unless specified
      const dayOfWeek = currentTime.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(businessHoursStart, 0, 0, 0);
        continue;
      }

      // Check time window preference
      const hour = currentTime.getHours();
      
      // Enforce absolute time limits (6 AM - 10 PM) regardless of preferences
      if (hour < absoluteMinHour || hour >= absoluteMaxHour) {
        // Too early or too late - skip to next day at business hours start
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(businessHoursStart, 0, 0, 0);
        continue;
      }
      
      let matchesTimeWindow = true;
      if (preferredTimeWindow === 'morning' && (hour < 9 || hour >= 12)) {
        matchesTimeWindow = false;
      } else if (preferredTimeWindow === 'afternoon' && (hour < 13 || hour >= 17)) {
        matchesTimeWindow = false;
      } else if (preferredTimeWindow === 'evening' && (hour < 17 || hour >= 20)) {
        matchesTimeWindow = false;
      }

      if (!matchesTimeWindow) {
        // Move to the next appropriate time window
        if (preferredTimeWindow === 'morning') {
          currentTime.setHours(9, 0, 0, 0);
        } else if (preferredTimeWindow === 'afternoon') {
          currentTime.setHours(13, 0, 0, 0);
        } else if (preferredTimeWindow === 'evening') {
          currentTime.setHours(17, 0, 0, 0);
        } else {
          // For 'any' window, ensure we're within reasonable hours and increment if needed
          if (hour < businessHoursStart) {
            currentTime.setHours(businessHoursStart, 0, 0, 0);
          } else if (hour >= absoluteMaxHour) {
            currentTime.setDate(currentTime.getDate() + 1);
            currentTime.setHours(businessHoursStart, 0, 0, 0);
          } else {
            currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
          }
        }
        continue;
      }

      // Check if current time is within preferred business hours (when 'any' window is selected)
      // For specific windows, we already validated above
      if (preferredTimeWindow === 'any' && (hour < businessHoursStart || hour >= defaultBusinessHoursEnd)) {
        // Skip to next day if outside default business hours and no specific preference
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(businessHoursStart, 0, 0, 0);
        continue;
      }
      
      // Additional check: ensure slot doesn't end after absolute max hour
      const slotEnd = new Date(currentTime.getTime() + durationMs);
      if (slotEnd.getHours() >= absoluteMaxHour || (slotEnd.getHours() === absoluteMaxHour - 1 && slotEnd.getMinutes() > 0)) {
        // Slot would end after 10 PM - skip to next day
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(businessHoursStart, 0, 0, 0);
        continue;
      }

      // Check if this slot conflicts with any busy period
      const conflicts = allBusyPeriods.some(busy => {
        return (
          (currentTime >= busy.start && currentTime < busy.end) ||
          (slotEnd > busy.start && slotEnd <= busy.end) ||
          (currentTime <= busy.start && slotEnd >= busy.end)
        );
      });

      if (!conflicts) {
        const slotDate = currentTime.toISOString().split('T')[0];
        
        // Check if we already have a slot for this date
        const hasSlotForDate = availableSlots.some(slot => slot.date === slotDate);
        
        // If we don't have a slot for this date yet, or we already have one but want more options
        if (!hasSlotForDate || availableSlots.length < 3) {
          availableSlots.push({
            startTime: currentTime.toISOString(),
            endTime: slotEnd.toISOString(),
            date: slotDate,
          });

          // Once we have 3 slots on different days, stop
          const uniqueDates = new Set(availableSlots.map(slot => slot.date));
          if (uniqueDates.size >= 3) {
            break;
          }
        }
      }

      // Move to next hour (or 30 minutes if duration is short)
      const increment = duration <= 30 ? 30 : 60;
      currentTime.setMinutes(currentTime.getMinutes() + increment);
    }

    // Ensure we return exactly 3 slots on different days
    const slotsByDate = new Map<string, TimeSlot>();
    for (const slot of availableSlots) {
      if (!slotsByDate.has(slot.date)) {
        slotsByDate.set(slot.date, slot);
        if (slotsByDate.size >= 3) {
          break;
        }
      }
    }

    return Array.from(slotsByDate.values());
  } catch (error) {
    console.error('Error finding available slots:', error);
    throw new Error(
      `Failed to find available slots: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function bookMeeting(
  attendeeEmail: string,
  slot: TimeSlot,
  meetingDetails: MeetingDetails,
  invitationMessage?: string
): Promise<{ eventId: string; success: boolean }> {
  try {
    const oauth2Client = await getAuthenticatedOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDateTime = new Date(slot.startTime);
    const endDateTime = new Date(slot.endTime);

    // Use invitationMessage if provided, otherwise fallback to meetingDetails.description or empty string
    const eventDescription = invitationMessage || meetingDetails.description || '';

    const calendarEvent = {
      summary: meetingDetails.title,
      description: eventDescription,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      },
      attendees: [
        { email: attendeeEmail },
      ],
      reminders: {
        useDefault: true,
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
      sendUpdates: 'all', // Send invitations to all attendees
    });

    return {
      eventId: response.data.id || '',
      success: true,
    };
  } catch (error: any) {
    console.error('Error booking meeting:', error);
    // If we get an auth error, try refreshing token
    if (error.code === 401 || error.message?.includes('Invalid Credentials')) {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get('google_refresh_token')?.value;
      if (refreshToken) {
        const oauth2Client = await getAuthenticatedOAuth2Client();
        await oauth2Client.refreshAccessToken();
        // Retry the booking
        return bookMeeting(attendeeEmail, slot, meetingDetails, invitationMessage);
      }
    }
    throw new Error(
      `Failed to book meeting: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

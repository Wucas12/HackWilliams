export interface MeetingRequest {
  email: string;
  naturalLanguage: string;
  timeRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  duration?: number; // Duration in minutes, optional override
}

export interface MeetingDetails {
  title: string;
  duration: number; // Duration in minutes
  preferredTime?: {
    date?: string; // ISO date string (YYYY-MM-DD)
    time?: string; // HH:MM format
    timeWindow?: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  description?: string;
  tone?: 'formal' | 'friendly'; // Tone for invitation message (default 'friendly')
  invitationMessage?: string; // Generated or edited invitation message
}

export interface TimeSlot {
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface MeetingBookingResponse {
  suggestedSlots: TimeSlot[];
  selectedSlot?: TimeSlot;
  eventId?: string;
  success?: boolean;
  error?: string;
}

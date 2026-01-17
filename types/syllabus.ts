export type EventType = 'class' | 'assignment' | 'exam' | 'project' | 'reading' | 'office_hours';

export type ResourceType = 'video' | 'article';

export interface StudyResource {
  title: string;
  url: string;
  type: ResourceType;
}

export interface SyllabusEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  location?: string;
  description?: string;
  studyResources?: StudyResource[];
  courseName?: string; // Course name (e.g., "CS 101", "Introduction to Computer Science")
}

export interface StressReport {
  hasStress: boolean;
  stressDays: {
    date: string;
    totalWeight: number;
    itemCount: number;
    events: SyllabusEvent[];
  }[];
}

export interface CalendarStressAnalysis {
  isHighStressWeek: boolean;
  averageEventsPerDay: number;
  highStressDays: {
    date: string;
    eventCount: number;
    calendarEventId?: string;
  }[];
  totalDays: number;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  field: 'courseName' | 'date' | 'section' | 'other';
  context?: string;
}

export interface ExtractionResponse {
  events: SyllabusEvent[];
  needsClarification?: boolean;
  questions?: ClarificationQuestion[];
}

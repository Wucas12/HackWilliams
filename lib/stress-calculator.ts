import { SyllabusEvent, StressReport } from '@/types/syllabus';

export function calculateStressScore(events: SyllabusEvent[]): StressReport {
  const stressDays: StressReport['stressDays'] = [];
  const dayMap = new Map<string, SyllabusEvent[]>();

  // Group events by date
  for (const event of events) {
    const date = event.date;
    if (!dayMap.has(date)) {
      dayMap.set(date, []);
    }
    dayMap.get(date)!.push(event);
  }

  // Analyze each day
  for (const [date, dayEvents] of dayMap.entries()) {
    const totalWeight = dayEvents.reduce((sum, event) => {
      return sum + (event.weight || 0);
    }, 0);

    const itemCount = dayEvents.length;

    // Flag if total weight > 15% or more than 3 items
    if (totalWeight > 15 || itemCount > 3) {
      stressDays.push({
        date,
        totalWeight,
        itemCount,
        events: dayEvents,
      });
    }
  }

  return {
    hasStress: stressDays.length > 0,
    stressDays: stressDays.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

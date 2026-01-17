'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSyllabusManager } from '@/hooks/useSyllabusManager';
import { SyllabusEvent } from '@/types/syllabus';

export default function Dashboard() {
  const {
    isExtracting,
    events,
    isSyncing,
    stressAnalysis,
    isAnalyzingStress,
    clarificationQuestions,
    clarificationAnswers,
    setClarificationAnswers,
    submitClarifications,
    processSyllabus,
    syncEvents,
    clearEvents,
    checkStress,
  } = useSyllabusManager();

  const [file, setFile] = useState<File | null>(null);
  const [totalDays, setTotalDays] = useState<number>(28);
  const [totalDaysInput, setTotalDaysInput] = useState<string>('28');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    try {
      await processSyllabus(file);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncEvents();
      alert(`Successfully synced ${result.synced} events to Google Calendar!`);
      // Auto-check stress after syncing with current time frame
      await checkStress(totalDays);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCheckStress = async () => {
    try {
      await checkStress(totalDays);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold">Syllabus Dashboard</h1>
          <Link
            href="/add-event"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add Custom Event
          </Link>
        </div>

        {/* Stress Alert - Only show when stress is detected */}
        {stressAnalysis && (stressAnalysis.isHighStressWeek || stressAnalysis.highStressDays.length > 0) && (
          <div className="mb-6 space-y-4">
            {stressAnalysis.isHighStressWeek && (
              <div className="p-4 bg-red-100 border-2 border-red-400 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-red-800 mb-2 text-lg">⚠️ High Stress Period Detected</h3>
                    <p className="text-red-700">
                      Average of {stressAnalysis.averageEventsPerDay.toFixed(1)} events per day 
                      over {stressAnalysis.totalDays} days (threshold: 5 events/day)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stressAnalysis.highStressDays.length > 0 && (
              <div className="p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2 text-lg">🚨 High Stress Days</h3>
                <p className="text-yellow-700 mb-2">The following days have more than 7 events:</p>
                <ul className="space-y-2">
                  {stressAnalysis.highStressDays.map((day) => (
                    <li key={day.date} className="text-yellow-700">
                      <strong>{new Date(day.date).toLocaleDateString()}:</strong> {day.eventCount} events
                      {day.calendarEventId && (
                        <span className="ml-2 text-sm text-yellow-600">(Calendar event created)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Clarification Questions Modal */}
        {clarificationQuestions.length > 0 && (
          <div className="mb-6 p-6 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-800">⚠️ Clarification Needed</h2>
            <p className="text-yellow-700 mb-4">
              We need some clarification to accurately extract events from your syllabus:
            </p>
            <div className="space-y-4 mb-4">
              {clarificationQuestions.map((question) => (
                <div key={question.id} className="p-4 bg-white rounded-lg border border-yellow-300">
                  <label className="block font-semibold text-gray-800 mb-2">
                    {question.question}
                  </label>
                  {question.context && (
                    <p className="text-sm text-gray-600 mb-2">Context: {question.context}</p>
                  )}
                  <input
                    type="text"
                    value={clarificationAnswers[question.id] || ''}
                    onChange={(e) =>
                      setClarificationAnswers({
                        ...clarificationAnswers,
                        [question.id]: e.target.value,
                      })
                    }
                    placeholder="Enter your answer..."
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={submitClarifications}
                disabled={isExtracting || clarificationQuestions.some(q => !clarificationAnswers[q.id])}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? 'Processing...' : 'Submit Answers'}
              </button>
              <button
                onClick={clearEvents}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="mb-6 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Upload Syllabus PDF</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mb-4"
          />
          <button
            onClick={handleProcess}
            disabled={!file || isExtracting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? 'Processing...' : 'Process Syllabus'}
          </button>
        </div>

        {/* Events List */}
        {events.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                Extracted Events ({events.length})
              </h2>
              <div className="space-x-2">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing...' : 'Sync to Calendar'}
                </button>
                <button
                  onClick={clearEvents}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function EventCard({ event }: { event: SyllabusEvent }) {
  // Parse date string (YYYY-MM-DD) as local date to avoid timezone shifts
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
          {event.type}
        </span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p>Date: {parseLocalDate(event.date).toLocaleDateString()}</p>
        {event.startTime && <p>Time: {event.startTime}</p>}
        {event.location && <p>Location: {event.location}</p>}
        {event.description && (
          <p className="mt-2 text-gray-800">{event.description}</p>
        )}
      </div>
    </div>
  );
}

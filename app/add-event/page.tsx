'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSyllabusManager } from '@/hooks/useSyllabusManager';

export default function AddEventPage() {
  const router = useRouter();
  const {
    isExtracting,
    events,
    isSyncing,
    clarificationQuestions,
    clarificationAnswers,
    setClarificationAnswers,
    submitClarifications,
    processSyllabus,
    syncEvents,
    clearEvents,
  } = useSyllabusManager();

  const [textInput, setTextInput] = useState<string>('');
  const [extractMultiple, setExtractMultiple] = useState<boolean>(false);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) {
      alert('Please enter some text describing your event(s)');
      return;
    }

    try {
      // Add extractMultiple as a parameter - we'll handle this by modifying the text input
      const textToProcess = extractMultiple ? textInput : `Extract only ONE event from: ${textInput}`;
      await processSyllabus(textToProcess);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSync = async () => {
    if (events.length === 0) {
      alert('No events to sync');
      return;
    }
    try {
      await syncEvents();
      alert(`Successfully synced ${events.length} event(s) to Google Calendar!`);
      setTextInput('');
      clearEvents();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">Add Custom Event</h1>
          <p className="text-gray-600">
            Describe your event(s) in natural language and we&apos;ll extract the details for you
          </p>
        </div>

        {/* Clarification Questions */}
        {clarificationQuestions.length > 0 && (
          <div className="mb-6 p-6 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-800">⚠️ Clarification Needed</h2>
            <p className="text-yellow-700 mb-4">
              We need some clarification to accurately extract events:
            </p>
            <div className="space-y-4 mb-4">
              {clarificationQuestions.map((question) => (
                <div key={question.id} className="p-4 bg-white rounded-lg border border-yellow-300">
                  <label className="block font-semibold text-gray-800 mb-2">
                    {question.question}
                  </label>
                  {question.context && question.context.trim() && (
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
                {isExtracting ? 'Processing...' : 'Submit Answer'}
              </button>
              <button
                onClick={() => {
                  clearEvents();
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Text Input Form */}
        {clarificationQuestions.length === 0 && (
          <form onSubmit={handleTextSubmit} className="mb-6 p-6 border rounded-lg">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Add event:
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!extractMultiple}
                    onChange={() => setExtractMultiple(false)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Single Event</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={extractMultiple}
                    onChange={() => setExtractMultiple(true)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Multiple Events</span>
                </label>
              </div>
              <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
                {extractMultiple ? 'Describe your events:' : 'Describe your event:'}
              </label>
              <textarea
                id="textInput"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={8}
                placeholder={extractMultiple 
                  ? "e.g., 'Midterm Exam on March 15th at 2:00 PM and Final Exam on May 1st at 10:00 AM'"
                  : "e.g., 'Midterm Exam for CS 101 on March 15th at 2:00 PM in Room 205'"}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isExtracting || !textInput.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExtracting ? 'Adding...' : 'Add to my Calendar'}
            </button>
          </form>
        )}

        {/* Extracted Events */}
        {events.length > 0 && clarificationQuestions.length === 0 && (
          <div className="mb-6 p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">
              Extracted Events ({events.length})
            </h2>
            <div className="space-y-4 mb-4">
              {events.map((event) => (
                <div key={event.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {event.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Date: {new Date(event.date + 'T00:00:00').toLocaleDateString()}</p>
                    {event.startTime && <p>Time: {event.startTime}</p>}
                    {event.location && <p>Location: {event.location}</p>}
                    {event.courseName && <p>Course: {event.courseName}</p>}
                    {event.description && (
                      <p className="mt-2 text-gray-800">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Sync to Google Calendar'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
'use client';

import LoginButton from '@/components/LoginButton';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Syllabus to Calendar</h1>
        <p className="text-gray-600 mb-8">
          Transform your syllabus PDFs into structured Google Calendar events
        </p>
        <LoginButton />
      </div>
    </main>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddEventPage() {
  const router = useRouter();
  
  // Redirect to dashboard with custom event mode
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
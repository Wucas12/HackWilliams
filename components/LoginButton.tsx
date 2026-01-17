'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:scale-105"
      style={{background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)'}}
    >
      {isLoading ? 'Loading...' : 'Sign in with Google'}
    </button>
  );
}

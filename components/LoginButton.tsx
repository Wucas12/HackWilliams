'use client';

import { useState } from 'react';

interface LoginButtonProps {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function LoginButton({ label, className, style }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

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

  const defaultClassName = 'px-6 py-3 text-white rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105';
  const defaultStyle = { background: 'linear-gradient(to right, rgb(80, 0, 130), #9333ea, #2563eb)' };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`${className ?? defaultClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
      style={style ?? defaultStyle}
    >
      {isLoading ? 'Loading...' : (label ?? 'Sign in with Google')}
    </button>
  );
}

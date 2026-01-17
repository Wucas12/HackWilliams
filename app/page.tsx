'use client';

import { useState, useEffect } from 'react';
import LoginButton from '@/components/LoginButton';

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  // Generate stable random values for floating dots to prevent hydration mismatch
  const [floatingDots, setFloatingDots] = useState<Array<{left: number; top: number; delay: number; duration: number}>>([]);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Initialize floating dots only on client to avoid hydration mismatch
  useEffect(() => {
    if (floatingDots.length === 0) {
      setFloatingDots(
        Array.from({ length: 20 }, () => ({
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 5,
          duration: 10 + Math.random() * 10,
        }))
      );
    }
  }, [floatingDots.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b overflow-hidden" style={{background: 'linear-gradient(to bottom, rgba(80, 0, 130, 0.1), white, rgb(219, 234, 254))'}}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Canela+Text:wght@300;400;700&display=swap" rel="stylesheet" />
      
      {/* Sign in button - Top right */}
      <div className="absolute top-6 right-6 z-50">
        <LoginButton />
      </div>

      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-pulse transition-all duration-2000"
          style={{ backgroundColor: 'rgba(80, 0, 130, 0.3)', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)' }}
        ></div>
        <div 
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-2000" 
          style={{animationDelay: '2s', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)', transitionDelay: '300ms'}}
        ></div>
        <div 
          className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-2000" 
          style={{animationDelay: '4s', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)', transitionDelay: '600ms'}}
        ></div>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingDots.map((dot, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-float"
            style={{
              backgroundColor: 'rgba(80, 0, 130, 0.6)',
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`,
              opacity: loaded ? 0.2 : 0,
              transition: 'opacity 2s'
            }}
          ></div>
        ))}
      </div>

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
        {/* Hero Section */}
        <div className="mb-12 md:mb-20 space-y-6 md:space-y-5">
          {/* Main Title - Left Aligned, 30% bigger */}
          <h1 
            className="text-4xl md:text-[8rem] lg:text-[10rem] font-light tracking-tight leading-none text-left"
            style={{
              fontFamily: "'Canela Text', serif",
              fontWeight: 250,
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
              transition: 'all 1s ease-out',
              transitionDelay: '400ms'
            }}
          >
            <span className="block" style={{color: 'rgb(80, 0, 130)'}}>
              SATURDAY.AI
            </span>
          </h1>
          
          {/* Subtext - Smaller and Staggered */}
          <div className="text-left space-y-4 md:space-y-2 pl-4 md:pl-8">
            {/* Subtitle - Staggered to the right */}
            <h2 
              className="text-md md:text-xl lg:text-2xl 2xl:text-3xl font-light tracking-wide"
              style={{
                fontFamily: "'Canela Text', serif",
                fontWeight: 250,
                color: '#1a1a1a',
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0) translateX(0)' : 'translateY(30px) translateX(-20px)',
                transition: 'all 1s ease-out',
                transitionDelay: '600ms'
              }}
            >
              Just tell your calendar what to do.
            </h2>

            {/* Tagline - Staggered further to the right */}
            <p 
              className="text-md md:text-xl lg:text-2xl 2xl:text-3xl font-light italic"
              style={{
                fontFamily: "'Canela Text', serif",
                fontWeight: 250,
                color: 'rgb(80, 0, 130)',
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0) translateX(0)' : 'translateY(20px) translateX(-20px)',
                transition: 'all 1s ease-out',
                transitionDelay: '800ms'
              }}
            >
              Get to Saturday faster.
            </p>

            {/* Description - Staggered even further */}
            <p 
              className="text-base md:text-lg lg:text-xl font-light max-w-3xl leading-tight"
              style={{
                fontFamily: "'Canela Text', serif",
                fontWeight: 300,
                color: '#4a4a4a',
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0) translateX(0)' : 'translateY(20px) translateX(-20px)',
                transition: 'all 1s ease-out',
                transitionDelay: '900ms'
              }}
            >
              Upload PDFs, create events in plain English, and let an AI agent handle scheduling—so you spend less time planning and more time living.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

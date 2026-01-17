'use client';

import { useState, useEffect, useRef } from 'react';
import LoginButton from '@/components/LoginButton';

const LANDING_CSS = `
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-20px) translateX(10px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.05); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(80, 0, 130, 0.3), 0 0 40px rgba(80, 0, 130, 0.1); }
    50% { box-shadow: 0 0 30px rgba(80, 0, 130, 0.5), 0 0 60px rgba(80, 0, 130, 0.2); }
  }
  @keyframes float-rotate {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  @keyframes slideInFromLeft {
    0% { opacity: 0; transform: translateX(-100px) rotate(-5deg); }
    100% { opacity: 1; transform: translateX(0) rotate(0deg); }
  }
  @keyframes slideInFromRight {
    0% { opacity: 0; transform: translateX(100px) rotate(5deg); }
    100% { opacity: 1; transform: translateX(0) rotate(0deg); }
  }
  @keyframes fadeInUp {
    0% { opacity: 0; transform: translateY(60px) scale(0.9); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes scaleIn {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes ripple {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  .animate-float { animation: float ease-in-out infinite; }
  .animate-pulse-custom { animation: pulse 4s ease-in-out infinite; }
  .landing-page * { cursor: none !important; }
  .custom-cursor {
    position: fixed; width: 12px; height: 12px; border-radius: 50%;
    background: rgb(120, 40, 170); pointer-events: none; z-index: 99999;
    box-shadow: 0 0 10px rgba(120, 40, 170, 0.8), 0 0 20px rgba(80, 0, 130, 0.6);
    transition: transform 0.05s ease;
  }
  .scroll-reveal { opacity: 0; }
  .scroll-reveal.revealed { animation-duration: 0.8s; animation-fill-mode: both; animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  .scroll-reveal.revealed.slide-left { animation-name: slideInFromLeft; }
  .scroll-reveal.revealed.slide-right { animation-name: slideInFromRight; }
  .scroll-reveal.revealed.fade-up { animation-name: fadeInUp; }
  .scroll-reveal.revealed.scale-in { animation-name: scaleIn; }
  .ripple-effect {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, rgba(120, 40, 170, 0.3), transparent);
    pointer-events: none; animation: ripple 1s ease-out;
  }
  .feature-card { position: relative; overflow: hidden; }
  .feature-card::before {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: linear-gradient(45deg, transparent, rgba(80, 0, 130, 0.1), transparent);
    transform: rotate(45deg); transition: all 0.6s ease; opacity: 0;
  }
  .feature-card:hover::before { opacity: 1; animation: shimmer 1.5s ease-in-out infinite; }
  .feature-card:hover { background: linear-gradient(135deg, rgba(255,255,255,1), rgba(250,240,255,0.9)) !important; }
  .icon-glow { filter: drop-shadow(0 0 0 transparent); transition: all 0.4s ease; }
  .feature-card:hover .icon-glow {
    filter: drop-shadow(0 0 8px rgba(80,0,130,0.6)) drop-shadow(0 0 15px rgba(120,40,170,0.4));
    animation: float-rotate 2s ease-in-out infinite;
  }
  .step-number {
    background: linear-gradient(135deg, rgba(80,0,130,0.1), rgba(80,0,130,0.05));
    border-radius: 12px; padding: 0.5rem 1rem;
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  .step-item:hover .step-number {
    background: linear-gradient(135deg, rgba(80,0,130,0.2), rgba(120,40,170,0.15));
    transform: scale(1.1) rotate(-5deg); animation: glow-pulse 2s ease-in-out infinite;
  }
  .magnetic-button { position: relative; overflow: hidden; }
  .magnetic-button::before {
    content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-radius: 50%;
    background: rgba(255,255,255,0.3); transform: translate(-50%,-50%);
    transition: width 0.6s ease, height 0.6s ease;
  }
  .magnetic-button:hover::before { width: 300px; height: 300px; }
  .magnetic-button span { position: relative; z-index: 1; }
  .glass-card { backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
`;

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [floatDots, setFloatDots] = useState<Array<{ left: number; top: number; delay: number; duration: number }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; size: number; speedX: number; speedY: number; life: number; decay: number; color: { r: number; g: number; b: number } }>>([]);
  const mouseRef = useRef({ mouseX: 0, mouseY: 0, cursorX: 0, cursorY: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    setFloatDots(
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
      }))
    );
  }, []);

  // Canvas, cursor, particle trail
  useEffect(() => {
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!canvas || !cursor) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const purpleShades = [
      { r: 80, g: 0, b: 130 },
      { r: 120, g: 40, b: 170 },
      { r: 160, g: 80, b: 200 },
      { r: 200, g: 120, b: 230 },
    ];

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.mouseX = e.clientX;
      mouseRef.current.mouseY = e.clientY;
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 8 + 4,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          life: 1,
          decay: 0.02,
          color: purpleShades[Math.floor(Math.random() * purpleShades.length)],
        });
      }
    };
    document.addEventListener('mousemove', handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= p.decay;
        p.size *= 0.96;
        ctx.save();
        ctx.globalAlpha = p.life;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},1)`);
        g.addColorStop(0.5, `rgba(${p.color.r},${p.color.g},${p.color.b},0.6)`);
        g.addColorStop(1, `rgba(${p.color.r},${p.color.g},${p.color.b},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (p.life <= 0) parts.splice(i, 1);
      }
      const m = mouseRef.current;
      m.cursorX += (m.mouseX - m.cursorX) * 0.2;
      m.cursorY += (m.mouseY - m.cursorY) * 0.2;
      cursor.style.transform = `translate(${m.cursorX - 6}px, ${m.cursorY - 6}px)`;
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Cursor hover on interactive elements
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const els = document.querySelectorAll('.landing-page button, .landing-page .feature-card, .landing-page .step-item, .landing-page a');
    const m = mouseRef.current;
    const onEnter = () => {
      cursor.style.transform = `translate(${m.cursorX - 8}px, ${m.cursorY - 8}px) scale(1.5)`;
      cursor.style.boxShadow = '0 0 20px rgba(120, 40, 170, 1), 0 0 40px rgba(80, 0, 130, 0.8)';
    };
    const onLeave = () => {
      cursor.style.transform = `translate(${m.cursorX - 6}px, ${m.cursorY - 6}px) scale(1)`;
      cursor.style.boxShadow = '0 0 10px rgba(120, 40, 170, 0.8), 0 0 20px rgba(80, 0, 130, 0.6)';
    };
    els.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });
    return () => {
      els.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, [loaded]);

  // Scroll reveal
  useEffect(() => {
    const opt = { threshold: 0.15, rootMargin: '0px 0px -100px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        const rect = entry.target.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const r = document.createElement('div');
        r.className = 'ripple-effect';
        Object.assign(r.style, { width: '100px', height: '100px', left: cx - 50 + 'px', top: cy - 50 + 'px' });
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 1000);
        observer.unobserve(entry.target);
      });
    }, opt);
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loaded]);

  // Feature card 3D tilt and magnetic buttons
  useEffect(() => {
    if (!loaded) return;
    const cards = document.querySelectorAll('.landing-page .feature-card');
    const buttons = document.querySelectorAll('.landing-page .magnetic-button');
    
    const cardHandlers: Array<{ card: HTMLElement; handlers: { type: string; handler: (e: Event) => void }[] }> = [];
    
    cards.forEach((card) => {
      const c = card as HTMLElement;
      const handlers = [
        { type: 'mouseenter', handler: () => {
          c.style.transform = 'translateY(-12px) scale(1.02)';
          c.style.boxShadow = '0 30px 60px -12px rgba(80, 0, 130, 0.35), 0 18px 36px -18px rgba(120, 40, 170, 0.2)';
          c.style.borderColor = 'rgba(80, 0, 130, 0.4)';
        }},
        { type: 'mouseleave', handler: () => {
          c.style.transform = 'translateY(0) scale(1)';
          c.style.boxShadow = 'none';
          c.style.borderColor = '';
        }},
        { type: 'mousemove', handler: (e: Event) => {
          const ev = e as MouseEvent;
          const rect = c.getBoundingClientRect();
          const x = ev.clientX - rect.left;
          const y = ev.clientY - rect.top;
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const rx = (y - cy) / 20;
          const ry = (cx - x) / 20;
          c.style.transform = `translateY(-12px) scale(1.02) perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }}
      ];
      handlers.forEach(({ type, handler }) => c.addEventListener(type, handler));
      cardHandlers.push({ card: c, handlers });
    });
    
    const buttonHandlers: Array<{ btn: HTMLElement; handlers: { type: string; handler: (e: Event) => void }[] }> = [];
    
    buttons.forEach((btn) => {
      const b = btn as HTMLElement;
      const handlers = [
        { type: 'mouseenter', handler: () => {
          b.style.transform = 'scale(1.05)';
          b.style.boxShadow = '0 20px 40px -10px rgba(80, 0, 130, 0.5)';
        }},
        { type: 'mouseleave', handler: () => {
          b.style.transform = 'scale(1)';
          b.style.boxShadow = 'none';
        }},
        { type: 'mousemove', handler: (e: Event) => {
          const ev = e as MouseEvent;
          const rect = b.getBoundingClientRect();
          const x = ev.clientX - rect.left - rect.width / 2;
          const y = ev.clientY - rect.top - rect.height / 2;
          b.style.transform = `scale(1.05) translate(${x * 0.1}px, ${y * 0.1}px)`;
        }}
      ];
      handlers.forEach(({ type, handler }) => b.addEventListener(type, handler));
      buttonHandlers.push({ btn: b, handlers });
    });
    
    return () => {
      cardHandlers.forEach(({ card, handlers }) => {
        handlers.forEach(({ type, handler }) => card.removeEventListener(type, handler));
      });
      buttonHandlers.forEach(({ btn, handlers }) => {
        handlers.forEach(({ type, handler }) => btn.removeEventListener(type, handler));
      });
    };
  }, [loaded]);

  return (
    <div className="landing-page min-h-screen bg-gradient-to-b overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(80, 0, 130, 0.1), white, rgb(219, 234, 254))' }}>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

      <div ref={cursorRef} className="custom-cursor" />
      <canvas ref={canvasRef} id="cursorCanvas" className="fixed top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 99998 }} />

      <div className="absolute top-6 right-6 z-50">
        <LoginButton
          label="Continue with Google"
          className="magnetic-button px-6 py-3 rounded-full font-medium transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgb(80, 0, 130), rgb(120, 40, 170))', color: 'white', fontFamily: "'Canela Text', serif" }}
        />
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div id="blob1" className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-custom transition-all duration-2000" style={{ backgroundColor: 'rgba(80, 0, 130, 0.3)', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)' }} />
        <div id="blob2" className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl transition-all duration-2000" style={{ animationDelay: '2s', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)', transitionDelay: '300ms' }} />
        <div id="blob3" className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl transition-all duration-2000" style={{ animationDelay: '4s', opacity: loaded ? 0.3 : 0, transform: loaded ? 'scale(1)' : 'scale(0.5)', transitionDelay: '600ms' }} />
      </div>

      <div id="particles" className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatDots.map((d, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full animate-float" style={{ backgroundColor: 'rgba(80, 0, 130, 0.6)', left: d.left + '%', top: d.top + '%', animationDelay: d.delay + 's', animationDuration: d.duration + 's', opacity: loaded ? 0.2 : 0, transition: 'opacity 2s' }} />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="mb-16 md:mb-24 space-y-6 md:space-y-5">
          <h1 id="mainTitle" className="text-4xl md:text-8xl lg:text-9xl font-light tracking-tight leading-none text-left" style={{ fontFamily: "'Canela Text', serif", fontWeight: 250, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)', transition: 'all 1s ease-out', transitionDelay: '400ms' }}>
            <span className="block" style={{ color: 'rgb(80, 0, 130)' }}>SATURDAY.AI</span>
          </h1>
          <div className="text-left space-y-4 md:space-y-2 pl-4 md:pl-8">
            <h2 id="subtitle" className="text-md md:text-xl lg:text-2xl 2xl:text-3xl font-light tracking-wide" style={{ fontFamily: "'Canela Text', serif", fontWeight: 250, color: '#1a1a1a', opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0) translateX(0)' : 'translateY(30px) translateX(-20px)', transition: 'all 1s ease-out', transitionDelay: '600ms' }}>
              Just tell your calendar what to do.
            </h2>
            <p id="tagline" className="text-md md:text-xl lg:text-2xl 2xl:text-3xl font-light italic" style={{ fontFamily: "'Canela Text', serif", fontWeight: 250, color: 'rgb(80, 0, 130)', opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0) translateX(0)' : 'translateY(20px) translateX(-20px)', transition: 'all 1s ease-out', transitionDelay: '800ms' }}>
              Get to Saturday faster.
            </p>
            <p id="description" className="text-base md:text-lg lg:text-xl font-light max-w-3xl leading-tight" style={{ fontFamily: "'Canela Text', serif", fontWeight: 300, color: '#4a4a4a', opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0) translateX(0)' : 'translateY(20px) translateX(-20px)', transition: 'all 1s ease-out', transitionDelay: '900ms' }}>
              Upload PDFs, create events in plain English, and let an AI agent handle scheduling—so you spend less time planning and more time living.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-20">
          <div className="feature-card scroll-reveal slide-left glass-card p-6 md:p-8 rounded-2xl border border-purple-100 transition-all duration-500 cursor-pointer" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))' }}>
            <div className="icon-glow text-4xl mb-4 inline-block">💬</div>
            <h3 className="text-xl md:text-2xl font-semibold mb-3" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>Natural Language</h3>
            <p className="text-base md:text-lg font-light leading-relaxed" style={{ fontFamily: "'Canela Text', serif", color: '#4a4a4a' }}>Type &quot;professor ask me for a dinner next Monday&quot; and watch the events appear instantly.</p>
          </div>
          <div className="feature-card scroll-reveal fade-up glass-card p-6 md:p-8 rounded-2xl border border-purple-100 transition-all duration-500 cursor-pointer" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))' }}>
            <div className="icon-glow text-4xl mb-4 inline-block">📄</div>
            <h3 className="text-xl md:text-2xl font-semibold mb-3" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>Smart PDF Upload</h3>
            <p className="text-base md:text-lg font-light leading-relaxed" style={{ fontFamily: "'Canela Text', serif", color: '#4a4a4a' }}>Drop your travel itinerary or conference schedule—we&apos;ll extract every detail.</p>
          </div>
          <div className="feature-card scroll-reveal slide-right glass-card p-6 md:p-8 rounded-2xl border border-purple-100 transition-all duration-500 cursor-pointer" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))' }}>
            <div className="icon-glow text-4xl mb-4 inline-block">🤖</div>
            <h3 className="text-xl md:text-2xl font-semibold mb-3" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>AI-Powered Agent</h3>
            <p className="text-base md:text-lg font-light leading-relaxed" style={{ fontFamily: "'Canela Text', serif", color: '#4a4a4a' }}>Your personal scheduling assistant learns your preferences and handles the rest.</p>
          </div>
        </div>

        <div id="howItWorks" className="scroll-reveal scale-in mb-20 p-8 md:p-12 rounded-3xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(80,0,130,0.05), rgba(80,0,130,0.1))' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full filter blur-3xl opacity-20" />
          <h2 className="text-3xl md:text-5xl font-light mb-8 text-center" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>How It Works</h2>
          <div className="space-y-6 relative z-10">
            <div className="step-item scroll-reveal slide-left flex items-start gap-6 cursor-pointer">
              <span className="step-number text-3xl md:text-4xl font-light" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>01</span>
              <p className="text-lg md:text-2xl font-light mt-2" style={{ fontFamily: "'Canela Text', serif", color: '#1a1a1a' }}>Connect your Google Calendar in seconds</p>
            </div>
            <div className="step-item scroll-reveal slide-right flex items-start gap-6 cursor-pointer">
              <span className="step-number text-3xl md:text-4xl font-light" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>02</span>
              <p className="text-lg md:text-2xl font-light mt-2" style={{ fontFamily: "'Canela Text', serif", color: '#1a1a1a' }}>Chat naturally or upload documents with event details</p>
            </div>
            <div className="step-item scroll-reveal slide-left flex items-start gap-6 cursor-pointer">
              <span className="step-number text-3xl md:text-4xl font-light" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>03</span>
              <p className="text-lg md:text-2xl font-light mt-2" style={{ fontFamily: "'Canela Text', serif", color: '#1a1a1a' }}>Watch as Saturday.AI intelligently organizes your schedule</p>
            </div>
            <div className="step-item scroll-reveal slide-right flex items-start gap-6 cursor-pointer">
              <span className="step-number text-3xl md:text-4xl font-light" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>04</span>
              <p className="text-lg md:text-2xl font-light mt-2" style={{ fontFamily: "'Canela Text', serif", color: '#1a1a1a' }}>Spend your time on what matters—not calendar management</p>
            </div>
          </div>
        </div>

        <div id="cta" className="scroll-reveal fade-up text-center py-12 md:py-16">
          <h2 className="text-3xl md:text-6xl font-light mb-6" style={{ fontFamily: "'Canela Text', serif", color: 'rgb(80, 0, 130)' }}>Ready to reclaim your time?</h2>
          <p className="text-lg md:text-2xl font-light mb-8 max-w-2xl mx-auto" style={{ fontFamily: "'Canela Text', serif", color: '#4a4a4a' }}>Join thousands who&apos;ve said goodbye to calendar chaos and hello to more Saturdays.</p>
          <LoginButton
            label="Get Started Free"
            className="magnetic-button px-8 py-4 rounded-full font-medium text-lg transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, rgb(80, 0, 130), rgb(120, 40, 170))', color: 'white', fontFamily: "'Canela Text', serif" }}
          />
        </div>
      </div>
    </div>
  );
}

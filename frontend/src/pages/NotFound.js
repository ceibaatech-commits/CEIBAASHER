import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';
import Header from '../components/Header';

const NotFound = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      <Header />

      {/* Animated gradient background that follows mouse */}
      <div
        className="absolute inset-0 opacity-30 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #6366f1 0%, #0f172a 50%, #020617 100%)`,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${8 + i * 6}px`,
              height: `${8 + i * 6}px`,
              background: i % 2 === 0 ? '#6366f1' : '#f59e0b',
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6">
        {/* 404 Number with glitch effect */}
        <div className="relative mb-6">
          <h1
            className="text-[120px] sm:text-[160px] lg:text-[200px] font-black leading-none tracking-tighter select-none"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 40%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(99, 102, 241, 0.3))',
            }}
          >
            404
          </h1>
          {/* Shadow text for depth */}
          <h1
            className="absolute top-1 left-1 text-[120px] sm:text-[160px] lg:text-[200px] font-black leading-none tracking-tighter select-none opacity-10 text-indigo-400"
            aria-hidden="true"
          >
            404
          </h1>
        </div>

        {/* Compass icon with spin */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 backdrop-blur-sm">
          <Compass
            className="w-8 h-8 text-indigo-400"
            style={{ animation: 'spin 8s linear infinite' }}
          />
        </div>

        {/* Message */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
          This page doesn't exist
        </h2>
        <p className="text-slate-400 text-sm sm:text-base text-center max-w-md mb-10 leading-relaxed">
          Looks like you've wandered off the map. The page you're looking for might have been moved or never existed.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate('/')}
            data-testid="404-go-home-btn"
            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => navigate(-1)}
            data-testid="404-go-back-btn"
            className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-12 flex flex-wrap gap-2 justify-center">
          {[
            { label: 'Capazoo', path: '/capazoo' },
            { label: 'Exams', path: '/' },
            { label: 'Join Room', path: '/join-room' },
            { label: 'My Board', path: '/board' },
          ].map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="px-4 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all border border-white/5 hover:border-white/15"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;

import React from 'react';

const CeibaaLogo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: { width: 40, height: 40, text: 'text-xl' },
    md: { width: 60, height: 60, text: 'text-2xl' },
    lg: { width: 80, height: 80, text: 'text-3xl' },
    xl: { width: 120, height: 120, text: 'text-5xl' }
  };

  const { width, height, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Animated Logo SVG */}
      <div className="relative" style={{ width, height }}>
        {/* Spinning Gradient Border */}
        <svg
          className="absolute inset-0 animate-spin-slow"
          viewBox="0 0 100 100"
          style={{ animationDuration: '3s' }}
        >
          <defs>
            <linearGradient id="spinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#spinGradient)"
            strokeWidth="3"
            strokeDasharray="10 5"
          />
        </svg>

        {/* Main Logo Shape - Curved C */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Letter C with neural network style */}
          <path
            d="M 70 30 A 25 25 0 0 1 70 70 L 65 70 A 20 20 0 0 0 65 30 Z"
            fill="url(#logoGradient)"
          />
          
          {/* Inner accent */}
          <path
            d="M 40 35 Q 35 50 40 65"
            stroke="url(#logoGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Pulsing Dot */}
        <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-pink-500 rounded-full animate-pulse-slow" />
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent ${text}`}>
            Ceibaa
          </span>
          <span className="text-xs text-gray-500 -mt-1">Neural Battle Arena</span>
        </div>
      )}
    </div>
  );
};

export default CeibaaLogo;

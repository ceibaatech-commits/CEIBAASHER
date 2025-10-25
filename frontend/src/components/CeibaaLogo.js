import React from 'react';

const CeibaaLogo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: { width: 50, height: 50, text: 'text-xl' },
    md: { width: 70, height: 70, text: 'text-2xl' },
    lg: { width: 100, height: 100, text: 'text-3xl' },
    xl: { width: 140, height: 140, text: 'text-5xl' }
  };

  const { width, height, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo SVG */}
      <svg width={width} height={height} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Main gradient cyan to pink */}
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00f5ff', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f472b6', stopOpacity: 1 }} />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g filter="url(#glow)">
          {/* Outer rotating arc - broken circle */}
          <g>
            <path
              d="M 100 20 A 80 80 0 1 1 40 140"
              stroke="url(#mainGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="4s"
              repeatCount="indefinite"
            />
          </g>
          
          {/* Second concentric arc */}
          <g>
            <path
              d="M 100 35 A 65 65 0 1 1 50 145"
              stroke="url(#mainGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="4s"
              repeatCount="indefinite"
            />
          </g>
          
          {/* Third inner arc */}
          <g>
            <path
              d="M 100 45 A 55 55 0 1 1 60 148"
              stroke="url(#mainGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.4"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="4s"
              repeatCount="indefinite"
            />
          </g>
          
          {/* Center C shape */}
          <path
            d="M 125 75 C 125 65, 115 55, 100 55 C 80 55, 65 70, 65 90 C 65 95, 66 100, 68 105 C 70 110, 73 115, 77 119 C 82 124, 88 127, 95 128 C 100 129, 105 128, 110 126"
            stroke="url(#mainGradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Glowing pulse dot */}
          <circle cx="170" cy="60" r="8" fill="#00f5ff">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="r" values="8;10;8" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          
          {/* Dot glow ring */}
          <circle cx="170" cy="60" r="12" fill="none" stroke="#00f5ff" strokeWidth="2" opacity="0.5">
            <animate attributeName="r" values="12;18;12" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent ${text}`}>
            Ceibaa
          </span>
          <span className="text-xs text-gray-500 -mt-1">Neural Battle Arena</span>
        </div>
      )}
    </div>
  );
};

export default CeibaaLogo;

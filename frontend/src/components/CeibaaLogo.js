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
      {/* Logo SVG */}
      <svg width={width} height={height} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00f5ff' }} />
            <stop offset="50%" style={{ stopColor: '#8b5cf6' }} />
            <stop offset="100%" style={{ stopColor: '#f472b6' }} />
          </linearGradient>
        </defs>
        
        {/* Rotating C-shaped arc */}
        <g>
          <path
            d="M100 40 C140 40, 170 70, 170 100 C170 130, 140 160, 100 160 C75 160, 55 140, 45 115"
            stroke="url(#neonGradient)"
            strokeWidth="15"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Pulse dot at top right */}
          <circle cx="170" cy="50" r="10" fill="#00f5ff">
            <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          
          {/* Rotation animation for the entire group */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="3s"
            repeatCount="indefinite"
          />
        </g>
      </svg>

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

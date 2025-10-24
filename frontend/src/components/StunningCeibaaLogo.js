import React from 'react';

const StunningCeibaaLogo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: { width: 50, height: 50, text: 'text-xl' },
    md: { width: 70, height: 70, text: 'text-2xl' },
    lg: { width: 100, height: 100, text: 'text-3xl' },
    xl: { width: 140, height: 140, text: 'text-5xl' }
  };

  const { width, height, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Container */}
      <div className="relative" style={{ width, height }}>
        {/* Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse-slow"></div>

        {/* Main SVG Container */}
        <svg
          className="relative w-full h-full"
          viewBox="0 0 100 100"
          style={{ filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.5))' }}
        >
          <defs>
            {/* Main Gradient */}
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00f5ff', stopOpacity: 1 }}>
                <animate attributeName="stop-color" values="#00f5ff; #8b5cf6; #f472b6; #00f5ff" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#f472b6', stopOpacity: 1 }}>
                <animate attributeName="stop-color" values="#f472b6; #00f5ff; #8b5cf6; #f472b6" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>

            {/* Glow Filter */}
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Brain Pattern */}
            <pattern id="brainPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1.5" fill="url(#neonGradient)" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
            </pattern>
          </defs>

          {/* Neon Arc - Main Logo Shape */}
          <path
            d="M 30 20 Q 20 50 30 80"
            stroke="url(#neonGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            filter="url(#neonGlow)"
            strokeDasharray="100"
            strokeDashoffset="100"
          >
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.5s" fill="freeze" />
          </path>

          {/* Secondary Arc */}
          <path
            d="M 40 25 Q 35 50 40 75"
            stroke="url(#neonGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
            filter="url(#neonGlow)"
          />

          {/* Brain/Mind Pattern Center */}
          <g opacity="0.4">
            <circle cx="60" cy="35" r="3" fill="url(#neonGradient)">
              <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="68" cy="42" r="2.5" fill="url(#neonGradient)">
              <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx="62" cy="50" r="2" fill="url(#neonGradient)">
              <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" begin="0.6s" />
            </circle>
            <circle cx="70" cy="56" r="2.8" fill="url(#neonGradient)">
              <animate attributeName="r" values="2.8;3.8;2.8" dur="2s" repeatCount="indefinite" begin="0.9s" />
            </circle>
            <circle cx="65" cy="65" r="3" fill="url(#neonGradient)">
              <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" begin="1.2s" />
            </circle>
            
            {/* Connecting Lines */}
            <line x1="60" y1="35" x2="68" y2="42" stroke="url(#neonGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="68" y1="42" x2="62" y2="50" stroke="url(#neonGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="62" y1="50" x2="70" y2="56" stroke="url(#neonGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="70" y1="56" x2="65" y2="65" stroke="url(#neonGradient)" strokeWidth="1" opacity="0.3" />
          </g>

          {/* Pulse Dot with Expanding Rings */}
          <g>
            {/* Expanding Ring 1 */}
            <circle cx="75" cy="25" r="5" fill="none" stroke="#00f5ff" strokeWidth="1" opacity="0">
              <animate attributeName="r" values="5;15;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.4;0" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Expanding Ring 2 */}
            <circle cx="75" cy="25" r="5" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0">
              <animate attributeName="r" values="5;15;20" dur="2s" repeatCount="indefinite" begin="0.7s" />
              <animate attributeName="opacity" values="0.8;0.4;0" dur="2s" repeatCount="indefinite" begin="0.7s" />
            </circle>
            {/* Core Pulse Dot */}
            <circle cx="75" cy="25" r="4" fill="url(#neonGradient)" filter="url(#neonGlow)">
              <animate attributeName="r" values="4;5;4" dur="1s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Energy Particles */}
          <g opacity="0.6">
            <circle cx="50" cy="30" r="1" fill="#00f5ff">
              <animateTransform attributeName="transform" type="translate" values="0,0; 5,-10; 0,0" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="55" cy="70" r="1.2" fill="#8b5cf6">
              <animateTransform attributeName="transform" type="translate" values="0,0; -8,12; 0,0" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="72" cy="45" r="0.8" fill="#f472b6">
              <animateTransform attributeName="transform" type="translate" values="0,0; 10,8; 0,0" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Indian Flag Tribute - Small Corner Element */}
          <g opacity="0.3">
            <rect x="82" y="82" width="3" height="2" fill="#FF9933" />
            <rect x="82" y="84" width="3" height="2" fill="#FFFFFF" />
            <rect x="82" y="86" width="3" height="2" fill="#138808" />
            <circle cx="83.5" cy="85" r="1" fill="#000080" opacity="0.5" />
          </g>
        </svg>

        {/* Outer Rotating Ring */}
        <div className="absolute inset-0 animate-spin-slow pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#neonGradient)"
              strokeWidth="1"
              strokeDasharray="8 8"
              opacity="0.4"
            />
          </svg>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span 
            className={`font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent ${text}`}
            style={{ 
              textShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
              letterSpacing: '-0.02em'
            }}
          >
            Ceibaa
          </span>
          <span className="text-[10px] text-gray-400 -mt-1 tracking-wide uppercase font-semibold">
            Mind vs Mind Battle
          </span>
        </div>
      )}
    </div>
  );
};

export default StunningCeibaaLogo;

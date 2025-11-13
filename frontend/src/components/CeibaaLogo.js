import React from 'react';

const CeibaaLogo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { scale: 0.5 },
    md: { scale: 0.7 },
    lg: { scale: 1 },
    xl: { scale: 1.4 }
  };

  const { scale } = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex flex-col items-center ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
      {/* Ceibaa Text with Multi-color Gradient */}
      <div className="relative">
        <svg width="280" height="90" viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Multi-color glossy gradient */}
            <linearGradient id="multiColorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="20%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
              <stop offset="40%" style={{ stopColor: '#d946ef', stopOpacity: 1 }} />
              <stop offset="60%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
              <stop offset="80%" style={{ stopColor: '#facc15', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            </linearGradient>
            
            {/* Glossy overlay gradient */}
            <linearGradient id="glossEffect" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
              <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
              <stop offset="100%" style={{ stopColor: '#000000', stopOpacity: 0.1 }} />
            </linearGradient>

            {/* Filter for sharp, crisp edges */}
            <filter id="sharpen">
              <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"/>
            </filter>
          </defs>
          
          {/* Main Text */}
          <text
            x="140"
            y="55"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="60"
            fontWeight="900"
            textAnchor="middle"
            fill="url(#multiColorGradient)"
            filter="url(#sharpen)"
            style={{
              letterSpacing: '2px',
              paintOrder: 'stroke fill'
            }}
          >
            Ceibaa
          </text>
          
          {/* Glossy overlay on text */}
          <text
            x="140"
            y="55"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="60"
            fontWeight="900"
            textAnchor="middle"
            fill="url(#glossEffect)"
            opacity="0.5"
            style={{
              letterSpacing: '2px',
              mixBlendMode: 'overlay'
            }}
          >
            Ceibaa
          </text>
        </svg>
      </div>

      {/* Mind Vs Mind Tagline */}
      <div className="mt-1">
        <span 
          className="text-gray-500 tracking-wider"
          style={{ 
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: '400',
            letterSpacing: '3px'
          }}
        >
          Mind Vs Mind
        </span>
      </div>
    </div>
  );
};

export default CeibaaLogo;

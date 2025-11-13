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
      {/* Logo Image */}
      <img 
        src="/ceibaa-logo-new.png"
        alt="Ceibaa Logo"
        style={{ width: `${width}px`, height: `${height}px` }}
        className="object-contain"
      />

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

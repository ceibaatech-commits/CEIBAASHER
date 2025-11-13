import React from 'react';

const CeibaaLogo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { height: 40 },
    md: { height: 60 },
    lg: { height: 80 },
    xl: { height: 100 }
  };

  const { height } = sizes[size] || sizes.md;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* Logo Image */}
      <img 
        src="/ceibaa-logo.png"
        alt="Ceibaa Logo"
        style={{ height: `${height}px`, width: 'auto' }}
        className="object-contain mb-2"
      />
      
      {/* Brand Name */}
      <div className="text-center">
        <div className="font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          style={{ fontSize: `${height * 0.3}px` }}>
          Ceibaa
        </div>
        <div className="text-gray-500 font-semibold tracking-wider"
          style={{ fontSize: `${height * 0.15}px` }}>
          Mind Vs Mind
        </div>
      </div>
    </div>
  );
};

export default CeibaaLogo;

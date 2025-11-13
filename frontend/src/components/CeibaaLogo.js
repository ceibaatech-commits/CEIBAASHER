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
    <img 
      src="/ceibaa-logo.png"
      alt="Ceibaa Logo"
      style={{ height: `${height}px`, width: 'auto' }}
      className={`object-contain ${className}`}
    />
  );
};

export default CeibaaLogo;

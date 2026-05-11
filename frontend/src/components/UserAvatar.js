import React, { useMemo } from 'react';

/**
 * UserAvatar Component - Enhanced with modern default avatars
 * Displays user's profile picture if available, otherwise shows stylish generated avatar
 * 
 * @param {Object} props
 * @param {string} props.profilePicture - User's profile picture URL or base64 data
 * @param {string} props.name - User's display name (for fallback avatar)
 * @param {string} props.userId - User ID for consistent color generation
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.clickable - Whether the avatar should have hover effects
 */

// Gradient presets for default avatars - vibrant and modern
const GRADIENT_PRESETS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-600',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-fuchsia-500 to-pink-500',
  'from-lime-500 to-green-500',
  'from-sky-500 to-indigo-500',
  'from-rose-500 to-pink-600',
];

// Pattern SVGs for more interesting avatars — rendered as safe JSX (no innerHTML).
// Returning <g> element keeps the parent <svg> viewBox intact.
const PATTERNS = [
  // 0 — Circles
  (
    <g key="circles">
      <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.1)" />
      <circle cx="30" cy="30" r="3" fill="rgba(255,255,255,0.1)" />
    </g>
  ),
  // 1 — Dots
  (
    <g key="dots">
      <circle cx="5" cy="5" r="1.5" fill="rgba(255,255,255,0.15)" />
      <circle cx="15" cy="15" r="1.5" fill="rgba(255,255,255,0.15)" />
      <circle cx="25" cy="25" r="1.5" fill="rgba(255,255,255,0.15)" />
      <circle cx="35" cy="35" r="1.5" fill="rgba(255,255,255,0.15)" />
    </g>
  ),
  // 2 — Diagonal lines
  (
    <g key="lines">
      <line x1="0" y1="40" x2="40" y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
    </g>
  ),
  // 3 — Solid (no pattern)
  null,
];

// Generate consistent hash from string
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const UserAvatar = ({ 
  profilePicture, 
  name = 'User',
  userId,
  size = 'md', 
  className = '', 
  onClick,
  clickable = false 
}) => {
  // Size mappings
  const sizeConfig = {
    xs: { class: 'w-6 h-6', fontSize: 'text-[10px]', ring: 'ring-1' },
    sm: { class: 'w-8 h-8', fontSize: 'text-xs', ring: 'ring-2' },
    md: { class: 'w-10 h-10', fontSize: 'text-sm', ring: 'ring-2' },
    lg: { class: 'w-12 h-12', fontSize: 'text-base', ring: 'ring-2' },
    xl: { class: 'w-16 h-16', fontSize: 'text-xl', ring: 'ring-3' },
    xxl: { class: 'w-24 h-24', fontSize: 'text-3xl', ring: 'ring-4' },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const hoverClass = clickable ? 'cursor-pointer hover:ring-purple-200 hover:scale-105 transition-all duration-200' : '';
  
  // Generate consistent gradient and pattern based on name or userId
  const avatarStyle = useMemo(() => {
    const seed = userId || name || 'default';
    const hash = hashString(seed);
    const gradientIndex = hash % GRADIENT_PRESETS.length;
    const patternIndex = hash % PATTERNS.length;
    
    return {
      gradient: GRADIENT_PRESETS[gradientIndex],
      pattern: PATTERNS[patternIndex],
    };
  }, [name, userId]);
  
  // Get initials (up to 2 characters)
  const initials = useMemo(() => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [name]);

  // If profile picture exists, display it
  if (profilePicture && profilePicture !== '👤') {
    return (
      <div 
        className={`${config.class} rounded-full overflow-hidden flex-shrink-0 ${config.ring} ring-white shadow-sm ${hoverClass} ${className}`}
        onClick={onClick}
      >
        <img 
          src={profilePicture} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, replace with gradient avatar
            e.target.onerror = null;
            e.target.style.display = 'none';
            const fallback = e.target.parentNode.querySelector('.avatar-fallback');
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback avatar (hidden by default) */}
        <div 
          className={`avatar-fallback w-full h-full bg-gradient-to-br ${avatarStyle.gradient} rounded-full items-center justify-center text-white font-bold ${config.fontSize} hidden`}
        >
          {initials}
        </div>
      </div>
    );
  }

  // Default: Stylish gradient avatar with optional pattern
  return (
    <div 
      className={`${config.class} bg-gradient-to-br ${avatarStyle.gradient} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${config.ring} ring-white shadow-md relative overflow-hidden ${hoverClass} ${className}`}
      onClick={onClick}
      style={{
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }}
    >
      {/* Pattern overlay — safe JSX, no innerHTML */}
      {avatarStyle.pattern && (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          {avatarStyle.pattern}
        </svg>
      )}
      {/* Initials */}
      <span className={`${config.fontSize} relative z-10`}>
        {initials}
      </span>
    </div>
  );
};

export default UserAvatar;

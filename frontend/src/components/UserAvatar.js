import React from 'react';

/**
 * UserAvatar Component
 * Displays user's profile picture if available, otherwise shows letter avatar
 * 
 * @param {Object} props
 * @param {string} props.profilePicture - User's profile picture URL or base64 data
 * @param {string} props.name - User's display name (for fallback letter)
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.clickable - Whether the avatar should have hover effects
 */
const UserAvatar = ({ 
  profilePicture, 
  name = 'User', 
  size = 'md', 
  className = '', 
  onClick,
  clickable = false 
}) => {
  // Size mappings
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
    xxl: 'w-40 h-40 text-5xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const hoverClass = clickable ? 'cursor-pointer hover:ring-4 hover:ring-purple-100 transition-all' : '';
  
  const initial = (name || 'U').charAt(0).toUpperCase();

  // If profile picture exists, display it
  if (profilePicture) {
    return (
      <div 
        className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${hoverClass} ${className}`}
        onClick={onClick}
      >
        <img 
          src={profilePicture} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show letter avatar
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
        {/* Fallback letter avatar (hidden by default, shown on image error) */}
        <div 
          className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold"
          style={{ display: 'none' }}
        >
          {initial}
        </div>
      </div>
    );
  }

  // Fallback: Letter avatar
  return (
    <div 
      className={`${sizeClass} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;

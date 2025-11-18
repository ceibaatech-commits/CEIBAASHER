import React, { useState } from 'react';
import './ReactionBubbles.css';

/**
 * ReactionBubbles Component
 * 
 * Modern, transparent reaction bubbles designed for quiz interfaces
 * Features:
 * - Semi-transparent white background (50-65% opacity)
 * - Crisp borders with subtle shadows
 * - Visible on both light and dark backgrounds
 * - Smooth hover and active states
 * - Floating animation for selected reactions
 */

const ReactionBubbles = ({ 
  onReactionSelect, 
  availableReactions = ['👍', '🔥', '😮', '💪', '🎯', '🎉', '❤️', '⭐'],
  size = 'medium', // small, medium, large
  variant = 'floating' // floating, static, compact
}) => {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const handleReactionClick = (reaction) => {
    setSelectedReaction(reaction);
    
    // Add floating animation
    if (variant === 'floating') {
      const id = Date.now();
      setFloatingReactions(prev => [...prev, { id, emoji: reaction }]);
      
      // Remove after animation completes
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    }
    
    if (onReactionSelect) {
      onReactionSelect(reaction);
    }
    
    // Reset selection after delay
    setTimeout(() => setSelectedReaction(null), 300);
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'reaction-bubble--small';
      case 'large': return 'reaction-bubble--large';
      default: return 'reaction-bubble--medium';
    }
  };

  return (
    <div className={`reaction-bubbles-container reaction-bubbles--${variant}`}>
      <div className="reaction-bubbles">
        {availableReactions.map((reaction, index) => (
          <button
            key={index}
            className={`reaction-bubble ${getSizeClass()} ${
              selectedReaction === reaction ? 'reaction-bubble--active' : ''
            }`}
            onClick={() => handleReactionClick(reaction)}
            aria-label={`React with ${reaction}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span className="reaction-emoji">{reaction}</span>
            <div className="reaction-glow"></div>
          </button>
        ))}
      </div>

      {/* Floating reaction animations */}
      {variant === 'floating' && (
        <div className="floating-reactions">
          {floatingReactions.map(({ id, emoji }) => (
            <div key={id} className="floating-reaction">
              {emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionBubbles;

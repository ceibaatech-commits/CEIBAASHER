import React from 'react';
import './BattleButton.css';

/**
 * BattleButton — cosmic "galaxy arena" CTA for competitive/PvP actions.
 *
 * Renders a dark radial-red button with orbiting stars, twinkling static
 * stars, a shine sweep, and a breathing red halo. Text stays fully readable
 * on top via z-index isolation.
 */
const BattleButton = ({
  onClick,
  label = 'Battle',
  icon = null,
  size = 'md',
  className = '',
  dataTestId,
  stopPropagation = false,
  ariaLabel,
}) => {
  const handleClick = (e) => {
    if (stopPropagation && e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (typeof onClick === 'function') onClick(e);
  };

  return (
    <div className={`galaxy-button galaxy-button--${size} ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel || label}
        data-testid={dataTestId}
      >
        <span className="spark" />
        <span className="backdrop" />
        <span className="galaxy__container">
          <span className="star star--static" />
          <span className="star star--static" />
          <span className="star star--static" />
          <span className="star star--static" />
        </span>
        <span className="galaxy">
          <span className="galaxy__ring">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="star" />
            ))}
          </span>
        </span>
        <span className="text">
          {icon && <span className="icon-slot">{icon}</span>}
          {label}
        </span>
      </button>
      <div className="bodydrop" />
    </div>
  );
};

export default BattleButton;

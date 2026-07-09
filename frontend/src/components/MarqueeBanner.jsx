
import React from 'react';

const MarqueeBanner = ({
  text = 'SPONSORED QUIZ • WIN PRIZES • PLAY NOW',
  secondText = 'TOPPERS FAVOURITE INSTITUTE',
  separator = '!!!',
  secondSeparator = '!!!',
  speed = 20,
  secondSpeed = 18,
  reverse = false,
  secondReverse = true,
  href = null,
  icon = '⚡',
  className = '',
}) => {
  const items = Array.from({ length: 8 });

  const renderSet = (prefix, rowText, rowSeparator) =>
    items.map((_, i) => (
      <span key={`${prefix}-${i}`} className="marquee-banner__item">
        <span className="marquee-banner__icon" aria-hidden="true">{icon}</span>
        <span className="marquee-banner__text">{rowText}</span>
        <span className="marquee-banner__sep">{rowSeparator}</span>
      </span>
    ));

  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href
    ? { href, target: '_blank', rel: 'noopener noreferrer', 'aria-label': text }
    : {};

  return (
    <Wrapper
      className={`marquee-banner-wrap ${href ? 'is-link' : ''} ${className}`}
      data-testid="marquee-banner"
      {...wrapperProps}
    >
      <style>{`
        .marquee-banner-wrap {
          position: relative;
          width: 100%;
          overflow: hidden;
          display: block;
          text-decoration: none;
        }

        .marquee-banner-wrap.is-link {
          cursor: pointer;
        }

        .marquee-banner-wrap.is-link:hover .marquee-banner {
          filter: brightness(1.08);
        }

        .marquee-banner {
          position: relative;
          width: 100%;
          background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
          overflow: hidden;
          user-select: none;
          transition: filter 0.2s ease;
          box-shadow:
            0 2px 0 0 rgba(0,0,0,0.15) inset,
            0 -2px 0 0 rgba(0,0,0,0.15) inset;
        }

        .marquee-banner__stripe {
          height: 5px;
          background-image: repeating-linear-gradient(
            -45deg,
            #FFEB3B 0 10px,
            #0a0a0f 10px 20px
          );
        }

        .marquee-banner__track-wrap {
          padding: 7px 0;
          overflow: hidden;
          position: relative;
        }

        .marquee-banner__track-wrap + .marquee-banner__track-wrap {
          border-top: 1px solid rgba(255,255,255,0.12);
        }

        .marquee-banner__track-wrap::before,
        .marquee-banner__track-wrap::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40px;
          z-index: 2;
          pointer-events: none;
        }

        .marquee-banner__track-wrap::before {
          left: 0;
          background: linear-gradient(90deg, #7c3aed 0%, transparent 100%);
        }

        .marquee-banner__track-wrap::after {
          right: 0;
          background: linear-gradient(-90deg, #7c3aed 0%, transparent 100%);
        }

        .marquee-banner__track {
          display: inline-flex;
          align-items: center;
          gap: 1.25rem;
          white-space: nowrap;
          will-change: transform;
        }

        .marquee-banner__track--first {
          animation: marquee-scroll ${speed}s linear infinite;
          animation-direction: ${reverse ? 'reverse' : 'normal'};
        }

        .marquee-banner__track--second {
          animation: marquee-scroll ${secondSpeed}s linear infinite;
          animation-direction: ${secondReverse ? 'reverse' : 'normal'};
        }

        .marquee-banner:hover .marquee-banner__track {
          animation-play-state: paused;
        }

        .marquee-banner__item {
          display: inline-flex;
          align-items: center;
          gap: 1.25rem;
        }

        .marquee-banner__icon {
          display: none;
          font-size: clamp(1rem, 2vw, 1.5rem);
          line-height: 1;
          filter: drop-shadow(1px 1px 0 #0a0a0f);
        }

        .marquee-banner__text,
        .marquee-banner__sep {
          font-family: 'Archivo Black', 'Impact', system-ui, sans-serif;
          font-weight: 900;
          font-size: clamp(0.85rem, 2.6vw, 1.35rem);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1;
        }

        .marquee-banner__text {
          color: #FFFFFF;
          text-shadow: 2px 2px 0 #0a0a0f;
        }

        .marquee-banner__sep {
          color: #FFEB3B;
          text-shadow: 2px 2px 0 #0a0a0f;
        }

        @media (min-width: 640px) {
          .marquee-banner__stripe { height: 6px; }
          .marquee-banner__track-wrap { padding: 8px 0; }
          .marquee-banner__track,
          .marquee-banner__item { gap: 1.75rem; }
          .marquee-banner__icon { display: inline-flex; }
        }

        @media (min-width: 1024px) {
          .marquee-banner__stripe { height: 7px; }
          .marquee-banner__track-wrap { padding: 10px 0; }
          .marquee-banner__track,
          .marquee-banner__item { gap: 2.25rem; }
        }

        @media (min-width: 1440px) {
          .marquee-banner__stripe { height: 8px; }
          .marquee-banner__track-wrap { padding: 12px 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-banner__track {
            animation: none;
          }
        }

        @keyframes marquee-scroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      <div className="marquee-banner">
        <div className="marquee-banner__stripe" />

        <div className="marquee-banner__track-wrap">
          <div className="marquee-banner__track marquee-banner__track--first">
            {renderSet('a1', text, separator)}
            {renderSet('b1', text, separator)}
          </div>
        </div>

        <div className="marquee-banner__track-wrap">
          <div className="marquee-banner__track marquee-banner__track--second">
            {renderSet('a2', secondText, secondSeparator)}
            {renderSet('b2', secondText, secondSeparator)}
          </div>
        </div>

        <div className="marquee-banner__stripe" />
      </div>
    </Wrapper>
  );
};

export default MarqueeBanner;
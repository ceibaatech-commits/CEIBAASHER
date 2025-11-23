import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactionBubbles from '../components/ReactionBubbles';
import ErrorBoundary from '../components/ErrorBoundary';
import styles from './ReactionBubblesDemo.module.css';

/**
 * Design Tokens
 */
const PATTERN_SVG = `
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <pattern id="a" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="scale(2) rotate(45)">
      <rect x="0" y="0" width="100%" height="100%" fill="#667eea"/>
      <path d="M0 20h40M20 0v40" stroke="#764ba2" stroke-width="1" fill="none"/>
    </pattern>
    <rect width="100%" height="100%" fill="url(#a)"/>
  </svg>
`;

const BACKGROUNDS = {
  light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  dark: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  gradient1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  gradient2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  gradient3: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  image: `url("data:image/svg+xml,${encodeURIComponent(PATTERN_SVG)}")`
};

const FEATURES = [
  {
    icon: '🎨',
    title: 'Background Adaptable',
    description: 'Works seamlessly on light, dark, and complex gradient backgrounds with automatic contrast adjustment.'
  },
  {
    icon: '✨',
    title: 'Smooth Animations',
    description: 'Carefully crafted hover, click, and transition animations for a delightful user experience.'
  },
  {
    icon: '🌓',
    title: 'Glass Morphism',
    description: 'Modern frosted glass effect with backdrop blur for depth and visual hierarchy.'
  },
  {
    icon: '📱',
    title: 'Mobile Optimized',
    description: 'Touch-friendly interface with responsive sizing and proper tap targets for all devices.'
  },
  {
    icon: '♿',
    title: 'Accessible',
    description: 'WCAG compliant with proper ARIA labels, keyboard navigation, and screen reader support.'
  },
  {
    icon: '⚡',
    title: 'Performance',
    description: 'Optimized rendering with CSS transforms and efficient React patterns for smooth 60fps animations.'
  }
];

/**
 * ReactionBubbles Demo Page
 * Showcases the reaction bubbles in various scenarios and backgrounds
 */
const ReactionBubblesDemo = () => {
  const [lastReaction, setLastReaction] = useState(null);
  const [backgroundMode, setBackgroundMode] = useState('light');

  // Fix memory leak: Clear timeout on unmount or when lastReaction changes
  useEffect(() => {
    if (lastReaction) {
      const timer = setTimeout(() => setLastReaction(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastReaction]);

  const handleReaction = (reaction) => {
    setLastReaction(reaction);
  };

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>
            Reaction Bubbles
          </h1>
          <p className={styles.subtitle}>
            Modern, transparent reaction bubbles designed for quiz interfaces.
            Visible on all backgrounds with smooth interactions.
          </p>
        </header>

        {/* Background Selector */}
        <div className={styles.backgroundSelector} role="tablist" aria-label="Background themes">
          {Object.keys(BACKGROUNDS).map(mode => (
            <button
              key={mode}
              onClick={() => setBackgroundMode(mode)}
              className={`${styles.backgroundButton} ${
                backgroundMode === mode ? styles.backgroundButtonActive : ''
              }`}
              role="tab"
              aria-selected={backgroundMode === mode}
              aria-label={`Switch to ${mode} background`}
              aria-controls="demo-area"
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Main Demo Area */}
        <div 
          id="demo-area"
          className={styles.demoArea}
          style={{ background: BACKGROUNDS[backgroundMode] }}
          role="region"
          aria-label="Reaction bubbles demonstration"
        >
          {/* Last Reaction Display */}
          {lastReaction && (
            <div 
              className={styles.lastReaction}
              role="status"
              aria-live="polite"
              aria-label={`You selected ${lastReaction} reaction`}
            >
              {lastReaction}
            </div>
          )}

          {/* Reaction Bubbles with Error Boundary */}
          <ErrorBoundary fallback={
            <div style={{ color: 'white', textAlign: 'center' }}>
              <p>😞 Oops! Something went wrong with the reactions.</p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          }>
            <ReactionBubbles 
              onReactionSelect={handleReaction}
              size="large"
              variant="floating"
            />
          </ErrorBoundary>

          {/* Info Text */}
          <p className={styles.infoText}>
            Click a reaction to see the floating animation
          </p>
        </div>

        {/* Size Variants */}
        <section className={styles.sizeVariantsSection} aria-labelledby="size-variants-title">
          <h2 id="size-variants-title" className={styles.sectionTitle}>
            Size Variants
          </h2>
          
          <div className={styles.variantsGrid}>
            {/* Small */}
            <div 
              className={styles.variantCard}
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              <h3 className={styles.variantTitle}>Small</h3>
              <ErrorBoundary fallback={<p style={{ color: 'white' }}>Error loading reactions</p>}>
                <ReactionBubbles size="small" variant="static" />
              </ErrorBoundary>
            </div>

            {/* Medium */}
            <div 
              className={styles.variantCard}
              style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
            >
              <h3 className={styles.variantTitle}>Medium</h3>
              <ErrorBoundary fallback={<p style={{ color: 'white' }}>Error loading reactions</p>}>
                <ReactionBubbles size="medium" variant="static" />
              </ErrorBoundary>
            </div>

            {/* Large */}
            <div 
              className={styles.variantCard}
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
            >
              <h3 className={styles.variantTitle}>Large</h3>
              <ErrorBoundary fallback={<p style={{ color: 'white' }}>Error loading reactions</p>}>
                <ReactionBubbles size="large" variant="static" />
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className={styles.featuresSection} aria-labelledby="features-title">
          <h2 id="features-title" className={styles.sectionTitle}>
            Key Features
          </h2>
          
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <article key={index} className={styles.featureCard}>
                <div className={styles.featureIcon} aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// PropTypes for documentation and type checking
ReactionBubblesDemo.propTypes = {
  // This component doesn't take props, but we document it for clarity
};

export default ReactionBubblesDemo;

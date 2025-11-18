import React, { useState } from 'react';
import ReactionBubbles from '../components/ReactionBubbles';

/**
 * ReactionBubbles Demo Page
 * Showcases the reaction bubbles in various scenarios and backgrounds
 */

const ReactionBubblesDemo = () => {
  const [lastReaction, setLastReaction] = useState(null);
  const [backgroundMode, setBackgroundMode] = useState('light');

  const handleReaction = (reaction) => {
    setLastReaction(reaction);
    setTimeout(() => setLastReaction(null), 2000);
  };

  const backgrounds = {
    light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    dark: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    gradient1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    gradient2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    gradient3: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    image: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpattern id=\'a\' patternUnits=\'userSpaceOnUse\' width=\'40\' height=\'40\' patternTransform=\'scale(2) rotate(45)\'%3E%3Crect x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' fill=\'%23667eea\'/%3E%3Cpath d=\'M0 20h40M20 0v40\' stroke=\'%23764ba2\' stroke-width=\'1\' fill=\'none\'/%3E%3C/pattern%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23a)\'/%3E%3C/svg%3E")'
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            Reaction Bubbles
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Modern, transparent reaction bubbles designed for quiz interfaces.
            Visible on all backgrounds with smooth interactions.
          </p>
        </div>

        {/* Background Selector */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap'
        }}>
          {Object.keys(backgrounds).map(mode => (
            <button
              key={mode}
              onClick={() => setBackgroundMode(mode)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: backgroundMode === mode ? '2px solid #667eea' : '2px solid #e2e8f0',
                background: backgroundMode === mode ? '#f8fafc' : 'white',
                color: backgroundMode === mode ? '#667eea' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Main Demo Area */}
        <div style={{
          background: backgrounds[backgroundMode],
          borderRadius: '24px',
          padding: '80px 40px',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Last Reaction Display */}
          {lastReaction && (
            <div style={{
              fontSize: '72px',
              marginBottom: '40px',
              animation: 'pulse 0.5s ease-in-out'
            }}>
              {lastReaction}
            </div>
          )}

          {/* Reaction Bubbles */}
          <ReactionBubbles 
            onReactionSelect={handleReaction}
            size="large"
            variant="floating"
          />

          {/* Info Text */}
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            fontWeight: '500',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            Click a reaction to see the floating animation
          </div>
        </div>

        {/* Size Variants */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Size Variants
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Small */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '16px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <h3 style={{ color: 'white', fontWeight: '600', margin: 0 }}>Small</h3>
              <ReactionBubbles size="small" variant="static" />
            </div>

            {/* Medium */}
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '16px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <h3 style={{ color: 'white', fontWeight: '600', margin: 0 }}>Medium</h3>
              <ReactionBubbles size="medium" variant="static" />
            </div>

            {/* Large */}
            <div style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: '16px',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <h3 style={{ color: 'white', fontWeight: '600', margin: 0 }}>Large</h3>
              <ReactionBubbles size="large" variant="static" />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Key Features
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                icon: '🎨',
                title: 'Semi-Transparent',
                desc: '50-65% opacity with backdrop blur for clarity'
              },
              {
                icon: '✨',
                title: 'Crisp Borders',
                desc: 'Subtle borders with layered shadows'
              },
              {
                icon: '🌓',
                title: 'Dark Mode',
                desc: 'Automatically adapts to dark backgrounds'
              },
              {
                icon: '📱',
                title: 'Responsive',
                desc: 'Works perfectly on all screen sizes'
              },
              {
                icon: '♿',
                title: 'Accessible',
                desc: 'Keyboard navigation and focus states'
              },
              {
                icon: '⚡',
                title: 'Performant',
                desc: 'Smooth 60fps animations'
              }
            ].map((feature, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{feature.icon}</div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '8px'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#64748b',
                  margin: 0
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '40px'
        }}>
          <h3 style={{ 
            color: 'white', 
            marginBottom: '16px',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Usage Example
          </h3>
          <pre style={{
            color: '#94a3b8',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: 0,
            overflow: 'auto'
          }}>
{`import ReactionBubbles from './components/ReactionBubbles';

function QuizInterface() {
  const handleReaction = (reaction) => {
    console.log('User reacted with:', reaction);
  };

  return (
    <ReactionBubbles 
      onReactionSelect={handleReaction}
      size="medium"
      variant="floating"
      availableReactions={['👍', '🔥', '😮', '💪', '🎯', '🎉']}
    />
  );
}`}
          </pre>
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ReactionBubblesDemo;

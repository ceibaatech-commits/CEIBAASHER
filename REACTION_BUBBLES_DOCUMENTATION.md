/* ============================================
   REACTION BUBBLES - FIXED GLASSMORPHISM
   Problem: 85% opacity = solid white circles
   Solution: Low opacity (20-35%) + strong blur
   ============================================ */

.reaction-bubbles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding: 8px;
}

.reaction-bubble {
  /* KEY FIX: Low opacity + blur = glass effect */
  background: rgba(255, 255, 255, 0.2);
  
  /* Strong blur creates the frosted glass look */
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  
  /* Visible border for definition */
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  
  /* Multi-layer shadow for depth */
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.6),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  
  /* Interaction */
  cursor: pointer;
  transition: all 0.25s ease;
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SIZE VARIANTS */
.reaction-bubble--small {
  width: 36px;
  height: 36px;
  font-size: 16px;
}

.reaction-bubble--medium {
  width: 52px;
  height: 52px;
  font-size: 22px;
}

.reaction-bubble--large {
  width: 64px;
  height: 64px;
  font-size: 28px;
}

/* EMOJI - Always fully visible */
.reaction-emoji {
  opacity: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
  line-height: 1;
}

/* HOVER STATE - Slightly more visible */
.reaction-bubble:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: scale(1.12) translateY(-2px);
  
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
}

/* ACTIVE/PRESSED STATE */
.reaction-bubble:active {
  background: rgba(255, 255, 255, 0.45);
  transform: scale(0.95);
  
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.12),
    inset 0 1px 2px rgba(255, 255, 255, 0.9);
}

/* FOCUS STATE - Accessibility */
.reaction-bubble:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.7);
  outline-offset: 2px;
}

/* DARK MODE - Adjust for dark backgrounds */
@media (prefers-color-scheme: dark) {
  .reaction-bubble {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.2),
      inset 0 1px 1px rgba(255, 255, 255, 0.2);
  }
  
  .reaction-bubble:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }
}

/* RESPONSIVE - Mobile */
@media (max-width: 480px) {
  .reaction-bubbles {
    gap: 8px;
  }
  
  .reaction-bubble--medium {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
}

/* REDUCED MOTION - Accessibility */
@media (prefers-reduced-motion: reduce) {
  .reaction-bubble {
    transition: none;
  }
}

/* ENTRY ANIMATION */
@keyframes bubbleIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.reaction-bubble {
  animation: bubbleIn 0.4s ease-out;
}

/* FLOATING REACTION ANIMATION */
@keyframes floatUp {
  0% {
    transform: translate(-50%, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + 30px), -120px) scale(0.7);
    opacity: 0;
  }
}
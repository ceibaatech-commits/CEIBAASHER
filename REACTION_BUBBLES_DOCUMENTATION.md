# 🎨 Reaction Bubbles - Design Documentation

## Overview

Modern, transparent reaction bubbles designed specifically for quiz interfaces. These bubbles maintain visual clarity even when transparent, with smooth interactions and excellent visibility on all backgrounds.

---

## 🎯 Design Specifications

### Visual Properties

#### Transparency & Background
- **Base opacity:** 55% (`rgba(255, 255, 255, 0.55)`)
- **Hover opacity:** 75% (`rgba(255, 255, 255, 0.75)`)
- **Active opacity:** 85% (`rgba(255, 255, 255, 0.85)`)
- **Backdrop filter:** `blur(12px) saturate(180%)`

#### Borders & Shadows
- **Border:** 1.5px solid `rgba(255, 255, 255, 0.3)`
- **Shadow layers:**
  - Outer shadow: `0 2px 8px rgba(0, 0, 0, 0.08)`
  - Close shadow: `0 1px 2px rgba(0, 0, 0, 0.04)`
  - Inner highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.6)`

#### Shape & Size
- **Shape:** Perfect circle (`border-radius: 50%`)
- **Sizes:**
  - Small: 36px × 36px (font-size: 16px)
  - Medium: 48px × 48px (font-size: 20px)
  - Large: 64px × 64px (font-size: 28px)

---

## 🌓 Dark Mode Support

### Automatic Adaptation
The bubbles automatically adapt to dark backgrounds using CSS `@media (prefers-color-scheme: dark)`:

```css
/* Light backgrounds */
background: rgba(255, 255, 255, 0.55);
border: rgba(255, 255, 255, 0.3);

/* Dark backgrounds */
background: rgba(255, 255, 255, 0.12);
border: rgba(255, 255, 255, 0.25);
```

### Visibility Strategy
1. **Light mode:** Higher base opacity (55%) for contrast
2. **Dark mode:** Lower base opacity (12%) to prevent glare
3. **Consistent contrast:** Border opacity adjusted for visibility
4. **Enhanced shadows:** Darker shadows in dark mode for depth

---

## ✨ Interactive States

### State Transitions

| State | Opacity | Scale | Shadow | Duration |
|-------|---------|-------|--------|----------|
| **Default** | 55% | 1.0 | Soft | - |
| **Hover** | 75% | 1.1 | Enhanced | 250ms |
| **Active** | 85% | 0.95 | Sharp | 250ms |
| **Focus** | 55% | 1.0 | Blue outline | - |

### Hover Effects
```css
.reaction-bubble:hover {
  background: rgba(255, 255, 255, 0.75);
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

### Active/Pressed Effects
```css
.reaction-bubble:active {
  background: rgba(255, 255, 255, 0.85);
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
```

---

## 🎬 Animations

### Entry Animation
```css
@keyframes bubbleIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Floating Reaction
When a reaction is clicked, it floats upward with a smooth animation:

```css
@keyframes floatUp {
  0% {
    transform: translate(-50%, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + 40px), -150px) scale(0.8);
    opacity: 0;
  }
}
```

**Duration:** 2 seconds  
**Easing:** `ease-out`  
**Path:** Slightly curved to the right

---

## 📱 Responsive Design

### Breakpoints

#### Mobile (≤480px)
```css
.reaction-bubble--medium {
  width: 40px;
  height: 40px;
  font-size: 16px;
}
```

#### Tablet (≤768px)
```css
.reaction-bubble--medium {
  width: 44px;
  height: 44px;
  font-size: 18px;
}
```

#### Desktop (>768px)
```css
.reaction-bubble--medium {
  width: 48px;
  height: 48px;
  font-size: 20px;
}
```

### Spacing Adjustments
- Desktop: 8px gap between bubbles
- Tablet: 6px gap
- Mobile: 4px gap

---

## ♿ Accessibility Features

### Keyboard Navigation
- **Tab:** Navigate between bubbles
- **Enter/Space:** Activate reaction
- **Escape:** Deselect/close

### Focus Indicator
```css
.reaction-bubble:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.6);
  outline-offset: 2px;
}
```

### Screen Reader Support
- ARIA labels on each button: `aria-label="React with 👍"`
- Semantic button elements
- Meaningful hover states

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .reaction-bubble,
  .reaction-emoji {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 🎨 Color Variants

### Base White (Default)
```css
background: rgba(255, 255, 255, 0.55);
```
Best for: Colorful backgrounds, gradients, images

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(0, 0, 0, 0.5);
}
```
Best for: Users who need extra contrast

---

## 🔧 Component Props

### `ReactionBubbles` Component

```typescript
interface ReactionBubblesProps {
  // Callback when reaction is selected
  onReactionSelect?: (reaction: string) => void;
  
  // Array of emoji reactions to display
  availableReactions?: string[];
  
  // Size variant
  size?: 'small' | 'medium' | 'large';
  
  // Visual variant
  variant?: 'floating' | 'static' | 'compact';
}
```

### Default Props
```javascript
{
  availableReactions: ['👍', '🔥', '😮', '💪', '🎯', '🎉', '❤️', '⭐'],
  size: 'medium',
  variant: 'floating'
}
```

---

## 💡 Usage Examples

### Basic Usage
```jsx
import ReactionBubbles from './components/ReactionBubbles';

function QuizQuestion() {
  return (
    <div>
      <h2>What's your reaction?</h2>
      <ReactionBubbles 
        onReactionSelect={(reaction) => {
          console.log('User reacted:', reaction);
        }}
      />
    </div>
  );
}
```

### Custom Reactions
```jsx
<ReactionBubbles 
  availableReactions={['😊', '😂', '😍', '🤔', '😱']}
  size="large"
  variant="floating"
/>
```

### Compact Variant (Quiz Results)
```jsx
<ReactionBubbles 
  availableReactions={['👍', '❤️', '🎉']}
  size="small"
  variant="compact"
/>
```

### Static Variant (No Animations)
```jsx
<ReactionBubbles 
  variant="static"
  size="medium"
/>
```

---

## 🎯 Best Practices

### Background Compatibility

#### ✅ Works Well On:
- Solid colors (light or dark)
- Gradients (any color combination)
- Images with varied contrast
- Video backgrounds
- Patterns and textures

#### ⚠️ May Need Adjustment:
- Pure white backgrounds (reduce opacity)
- Very bright backgrounds (consider darker border)

### Performance Tips

1. **Use `will-change` sparingly:**
   ```css
   .reaction-bubble:hover {
     will-change: transform;
   }
   ```

2. **Limit concurrent animations:**
   - Maximum 3-5 floating reactions at once
   - Clear completed animations promptly

3. **Optimize backdrop-filter:**
   - Use only when needed
   - Consider disabling on low-end devices

### UX Recommendations

1. **Placement:**
   - Below quiz questions
   - In results screens
   - On answer feedback cards
   - In chat/comment sections

2. **Spacing:**
   - Minimum 40px from other interactive elements
   - Centered horizontally when possible
   - Group related reactions together

3. **Feedback:**
   - Show floating animation on selection
   - Display count of reactions received
   - Highlight user's own reaction

---

## 🐛 Troubleshooting

### Issue: Bubbles not visible
**Solution:** Check background contrast. May need to adjust opacity or add darker border.

```css
/* For very light backgrounds */
.reaction-bubble {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
}
```

### Issue: Animations stuttering
**Solution:** Reduce concurrent animations or disable for low-end devices.

```javascript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
<ReactionBubbles variant={isMobile ? 'static' : 'floating'} />
```

### Issue: Hover state not working on mobile
**Solution:** This is expected. Use `:active` state or tap feedback instead.

```css
.reaction-bubble:active {
  /* Mobile tap feedback */
  transform: scale(0.95);
}
```

---

## 📊 Performance Metrics

### Target Metrics
- **Initial render:** < 16ms
- **Hover transition:** 60fps (16.67ms per frame)
- **Animation smoothness:** Consistent 60fps
- **Memory usage:** < 10MB for 10 bubbles

### Optimization Applied
- ✅ CSS transforms (GPU-accelerated)
- ✅ Backdrop-filter with hardware acceleration
- ✅ Efficient DOM updates (React keys)
- ✅ Debounced floating animations
- ✅ Cleanup of completed animations

---

## 🎨 Design Tokens

```css
/* Opacity Values */
--bubble-opacity-base: 0.55;
--bubble-opacity-hover: 0.75;
--bubble-opacity-active: 0.85;
--bubble-opacity-dark: 0.12;

/* Spacing */
--bubble-gap-desktop: 8px;
--bubble-gap-tablet: 6px;
--bubble-gap-mobile: 4px;

/* Timing */
--bubble-transition-duration: 250ms;
--bubble-animation-duration: 400ms;
--bubble-float-duration: 2000ms;

/* Shadows */
--bubble-shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
--bubble-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.12);
--bubble-shadow-active: 0 1px 4px rgba(0, 0, 0, 0.1);

/* Border */
--bubble-border-width: 1.5px;
--bubble-border-color: rgba(255, 255, 255, 0.3);
--bubble-border-hover: rgba(255, 255, 255, 0.5);
```

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Customizable color themes
- [ ] Reaction counters
- [ ] Multiple selection mode
- [ ] Reaction trails
- [ ] Sound effects (optional)
- [ ] Haptic feedback (mobile)
- [ ] Long-press for alternate reactions
- [ ] Skin tone variations

### Under Consideration
- [ ] 3D transform effects
- [ ] Particle effects
- [ ] Reaction voting system
- [ ] Animated emoji (Lottie)
- [ ] Voice reaction integration

---

## 📚 References

### Design Inspiration
- iOS Messages reactions
- Slack emoji reactions
- Discord reactions
- LinkedIn post reactions

### Technical References
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [CSS Tricks: Glassmorphism](https://css-tricks.com/glassmorphism/)
- [Material Design: Motion](https://material.io/design/motion)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-18  
**Maintainer:** Development Team

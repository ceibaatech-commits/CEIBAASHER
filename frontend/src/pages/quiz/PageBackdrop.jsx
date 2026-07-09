import React from 'react';

/**
 * Full-viewport dark backdrop used only by the IntroScreen and the initial
 * loading state. QuizScreen and ResultsScreen provide their own full-bleed
 * purple backgrounds so this component isn't rendered on those phases.
 */
const PageBackdrop = () => (
  <>
    {/* Base */}
    <div className="fixed inset-0 -z-20 bg-[#0a0a12]" aria-hidden />
    {/* Soft indigo/purple glow (top-left) */}
    <div
      className="fixed -z-10 pointer-events-none"
      style={{
        top: -160, left: -160, width: 560, height: 560,
        background:
          'radial-gradient(closest-side, rgba(99,102,241,0.28), rgba(99,102,241,0) 70%)',
      }}
      aria-hidden
    />
    {/* Teal accent glow (bottom-right) */}
    <div
      className="fixed -z-10 pointer-events-none"
      style={{
        bottom: -200, right: -200, width: 560, height: 560,
        background:
          'radial-gradient(closest-side, rgba(45,212,191,0.18), rgba(45,212,191,0) 70%)',
      }}
      aria-hidden
    />
    {/* Subtle grain */}
    <div
      className="fixed inset-0 -z-10 pointer-events-none opacity-[0.05] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
      }}
      aria-hidden
    />
  </>
);

export default PageBackdrop;

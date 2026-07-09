// Shared constants for the SponsoredQuiz screens.
// Kept in one small module so no screen file has to redefine them.

export const POINTS_PER_CORRECT = 100;

// Bottom offset for the fixed action bar (Next question / Play again).
// Reserves space for a typical mobile bottom nav (~72px) + safe-area inset,
// with a small visual gap above the nav so it doesn't feel glued to it.
export const ACTION_BAR_OFFSET = 'calc(5rem + env(safe-area-inset-bottom, 0px))'; // ~80px

// Section padding-bottom on Quiz + Results — leaves enough room so the last
// inline element (explanation / leaderboard) is never obscured by either the
// fixed action bar or a host-app bottom nav.
export const BOTTOM_SAFE = 'calc(10.5rem + env(safe-area-inset-bottom, 0px))'; // ~168px

export const optionLetters = ['A', 'B', 'C', 'D'];
export const optionKey = (letter) => `option_${letter.toLowerCase()}`;

// Medal palettes for the on-screen MedalGraphic. Kept in sync with the same
// object in /lib/generateShareCard.js which is used to render the share PNG.
export const MEDAL_PALETTES = {
  gold: { top: '#fde68a', bottom: '#f59e0b', ring: '#b45309' },
  silver: { top: '#e5e7eb', bottom: '#9ca3af', ring: '#4b5563' },
  bronze: { top: '#fed7aa', bottom: '#c2410c', ring: '#7c2d12' },
  default: { top: '#c4b5fd', bottom: '#7c3aed', ring: '#4c1d95' },
};

export const RESULT_TABS = [
  { id: 'standings', label: 'Standings' },
  { id: 'summary', label: 'Summary' },
];

/** Shared colour tokens used across all battle screens. */
export const C = {
  cream: '#F5F0EB',
  pink: '#F9D5C8',
  red: '#E8503A',
  blue: '#5B8FD4',
  redLight: '#FDE8E4',
  blueLight: '#E4EEF9',
  white: '#FFFFFF',
};

/** Reasons shown in the in-battle report sheet. */
export const REPORT_REASONS = [
  { id: 'nudity',                label: 'Nudity / Sexual Content' },
  { id: 'harassment',            label: 'Harassment / Bullying' },
  { id: 'offensive_content',     label: 'Offensive Content' },
  { id: 'cheating',              label: 'Cheating' },
  { id: 'inappropriate_behavior',label: 'Other Inappropriate Behaviour' },
];

/**
 * Scoring configuration.
 *   MAX_PER_QUESTION — maximum points available for a single question
 *   CORRECT_BASE      — guaranteed points for a correct answer (no time)
 *   TIME_BONUS_MAX    — bonus added for answering quickly
 *   WRONG_PENALTY     — deduction for a wrong answer
 *   SKIP_POINTS       — points awarded when a question is skipped
 */
export const SCORE = {
  MAX_PER_QUESTION: 100,
  TIME_LIMIT: 30,
  TIME_BONUS_MAX: 30,
  CORRECT_BASE: 60,
  WRONG_PENALTY: -20,
  SKIP_POINTS: 0,
};

/**
 * Return the score delta for a single answered question.
 * @param {{ outcome: 'correct'|'wrong'|'skip', timeLeft?: number }} param
 */
export function calcQuestionScore({ outcome, timeLeft = SCORE.TIME_LIMIT }) {
  if (outcome === 'correct') {
    const clampedTime = Math.max(0, Math.min(SCORE.TIME_LIMIT, timeLeft));
    const timeBonus = Math.round((SCORE.TIME_BONUS_MAX * clampedTime) / SCORE.TIME_LIMIT);
    return Math.min(SCORE.MAX_PER_QUESTION, SCORE.CORRECT_BASE + timeBonus);
  }
  if (outcome === 'wrong') return SCORE.WRONG_PENALTY;
  return SCORE.SKIP_POINTS;
}

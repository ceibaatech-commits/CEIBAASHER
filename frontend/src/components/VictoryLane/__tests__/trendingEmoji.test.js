import { getTrendingEmojiForHour } from '../utils/trendingEmoji';

describe('getTrendingEmojiForHour', () => {
  test('returns popcorn-independent mapped emoji by hour', () => {
    expect(getTrendingEmojiForHour(0)).toBe('🌚');
    expect(getTrendingEmojiForHour(4)).toBe('🌨️');
    expect(getTrendingEmojiForHour(5)).toBe('🌤️');
    expect(getTrendingEmojiForHour(7)).toBe('☕️');
    expect(getTrendingEmojiForHour(9)).toBe('⛅️');
    expect(getTrendingEmojiForHour(11)).toBe('☀️');
    expect(getTrendingEmojiForHour(12)).toBe('🌈');
    expect(getTrendingEmojiForHour(15)).toBe('🧋');
    expect(getTrendingEmojiForHour(17)).toBe('🌥️');
    expect(getTrendingEmojiForHour(19)).toBe('🌩️');
    expect(getTrendingEmojiForHour(20)).toBe('☁️');
    expect(getTrendingEmojiForHour(21)).toBe('🥤');
    expect(getTrendingEmojiForHour(23)).toBe('🌚');
  });

  test('falls back to night emoji on invalid hour input', () => {
    expect(getTrendingEmojiForHour(undefined)).toBe('🌚');
    expect(getTrendingEmojiForHour('bad')).toBe('🌚');
    expect(getTrendingEmojiForHour(NaN)).toBe('🌚');
  });
});

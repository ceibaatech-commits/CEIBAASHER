export const getTrendingEmojiForHour = (hour) => {
  const h = Number(hour);

  if (!Number.isFinite(h)) return '🌚';

  if (h >= 0 && h < 4) return '🌚';
  if (h >= 4 && h < 5) return '🌨️';
  if (h >= 5 && h < 7) return '🌤️';
  if (h >= 7 && h < 9) return '☕️';
  if (h >= 9 && h < 11) return '⛅️';
  if (h >= 11 && h < 12) return '☀️';
  if (h >= 12 && h < 13) return '🌈';
  if (h >= 13 && h < 15) return '🌤️';
  if (h >= 15 && h < 17) return '🧋';
  if (h >= 17 && h < 19) return '🌥️';
  if (h >= 19 && h < 20) return '🌩️';
  if (h >= 20 && h < 21) return '☁️';
  if (h >= 21 && h < 22) return '🥤';

  return '🌚';
};

export const getTrendingEmojiNow = () => getTrendingEmojiForHour(new Date().getHours());

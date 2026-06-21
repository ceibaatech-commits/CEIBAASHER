/**
 * useChatTheme.js
 *
 * Chat-scoped theme hook. Persists the user's light/dark/system preference in
 * localStorage so it survives page refreshes without affecting the rest of the
 * app's colour scheme.
 */
import { useState, useEffect } from 'react';

export const THEME_STORAGE_KEY = 'ceibaa.chat.theme'; // 'light' | 'dark' | 'system'

/**
 * @returns {{ isDark: boolean, pref: string, setPreference: (v: string) => void }}
 */
export const useChatTheme = () => {
  const [pref, setPref] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    } catch (_e) {
      return 'system';
    }
  });

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const isDark = pref === 'dark' || (pref === 'system' && systemDark);

  const setPreference = (next) => {
    setPref(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (_e) { /* ignore */ }
  };

  return { isDark, pref, setPreference };
};

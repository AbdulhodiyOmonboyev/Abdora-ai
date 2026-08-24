import { useEffect, useState } from 'react';

const THEME_KEY = 'abdora-landing-theme';

/**
 * Shared dark/light theme state for all public marketing pages
 * (landing, services, documents, contact). Persists to localStorage so the
 * choice carries across pages, and defaults to the visitor's OS preference
 * on first visit.
 */
export default function usePublicTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark];
}

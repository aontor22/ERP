export type Theme = 'light' | 'dark';
export type ThemeMode = Theme;

const THEME_STORAGE_KEY = 'apex_theme';

export function getInitialTheme(defaultDarkMode?: boolean): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (e) {
    // Storage access might be restricted in some iframe environments
  }

  if (typeof defaultDarkMode === 'boolean') {
    return defaultDarkMode ? 'dark' : 'light';
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return 'light';
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // Ignore storage errors
  }
}

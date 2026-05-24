export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'tfbp_theme';

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function canUseMatchMedia() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function getStoredThemePreference(): ThemePreference | null {
  if (!canUseLocalStorage()) return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredThemePreference(value: ThemePreference): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Preference storage is optional; React state still updates.
  }
}

export function clearStoredThemePreference(): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

export function getSystemTheme(): EffectiveTheme {
  if (!canUseMatchMedia()) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

export function watchSystemTheme(callback: (theme: EffectiveTheme) => void): () => void {
  if (!canUseMatchMedia()) return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (event: MediaQueryListEvent) => callback(event.matches ? 'dark' : 'light');

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }

  media.addListener(listener);
  return () => media.removeListener(listener);
}

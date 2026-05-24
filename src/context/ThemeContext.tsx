import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getStoredThemePreference,
  resolveEffectiveTheme,
  setStoredThemePreference,
  watchSystemTheme,
  type EffectiveTheme,
  type ThemePreference,
} from '../lib/theme';

type ThemeValue = {
  themePreference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setThemePreference: (preference: ThemePreference) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function applyDocumentTheme(preference: ThemePreference, theme: EffectiveTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => getStoredThemePreference() ?? 'system');
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => resolveEffectiveTheme(themePreference));
  const setThemePreference = useCallback((preference: ThemePreference) => {
    setStoredThemePreference(preference);
    setThemePreferenceState(preference);
  }, []);

  useEffect(() => {
    const nextTheme = resolveEffectiveTheme(themePreference);
    setEffectiveTheme(nextTheme);
    applyDocumentTheme(themePreference, nextTheme);

    if (themePreference !== 'system') return undefined;
    return watchSystemTheme((systemTheme) => {
      setEffectiveTheme(systemTheme);
      applyDocumentTheme('system', systemTheme);
    });
  }, [themePreference]);

  const value = useMemo(() => {
    return {
      themePreference,
      effectiveTheme,
      setThemePreference,
      isDark: effectiveTheme === 'dark',
    };
  }, [effectiveTheme, setThemePreference, themePreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

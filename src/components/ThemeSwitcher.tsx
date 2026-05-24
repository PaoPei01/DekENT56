import { Monitor, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import type { ThemePreference } from '../lib/theme';

const themeOptions: Array<{ value: ThemePreference; icon: typeof Monitor }> = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const { themePreference, setThemePreference } = useTheme();
  const labels: Record<ThemePreference, string> = {
    system: t('theme.systemTheme'),
    light: t('theme.lightTheme'),
    dark: t('theme.darkTheme'),
  };

  return (
    <div className={`theme-switcher ${compact ? 'theme-switcher-compact' : ''}`} role="group" aria-label={t('theme.theme')}>
      {themeOptions.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          className={themePreference === value ? 'active' : ''}
          aria-pressed={themePreference === value}
          onClick={() => setThemePreference(value)}
        >
          <Icon size={16} aria-hidden="true" />
          <span>{compact ? labels[value] : labels[value]}</span>
        </button>
      ))}
    </div>
  );
}

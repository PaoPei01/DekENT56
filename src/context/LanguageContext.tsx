import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../lib/i18n';
import { copy } from '../lib/i18n';

type LanguageValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: typeof copy.th;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'th');
  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: Language) => {
        localStorage.setItem('language', next);
        setLanguage(next);
      },
      t: copy[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppLanguage } from '../lib/i18n';
import { copy, detectInitialLanguage, isThaiLanguage, setStoredLanguage, translate } from '../lib/i18n';

type LanguageValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  isThai: boolean;
  t: ((key: string, params?: Record<string, string | number>) => string) & typeof copy.th;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => detectInitialLanguage());
  const value = useMemo(
    () => {
      const translateKey = (key: string, params?: Record<string, string | number>) => translate(language, key, params);
      const t = new Proxy(translateKey, {
        get(target, property, receiver) {
          if (typeof property === 'string' && property in copy[language]) {
            return copy[language][property as keyof typeof copy.th];
          }
          return Reflect.get(target, property, receiver);
        },
      }) as LanguageValue['t'];
      const setLanguage = (next: AppLanguage) => {
        setStoredLanguage(next);
        setLanguageState(next);
      };
      return {
        language,
        setLanguage,
        toggleLanguage: () => setLanguage(language === 'th' ? 'en' : 'th'),
        isThai: isThaiLanguage(language),
        t,
      };
    },
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

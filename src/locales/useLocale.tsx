/**
 * React Context and Hook for Clinical EKG Localization
 * Enables instantaneous switching between Indonesian (id) and English (en).
 * Strictly zero em-dashes (Unicode U+2014 banned).
 */

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Locale, TranslationDictionary } from './types';
import { idTranslations } from './id';
import { enTranslations } from './en';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDictionary;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const parentContext = useContext(LocaleContext);
  const [localeState, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('cardiosim_locale');
      if (saved === 'en' || saved === 'id') return saved;
    } catch {}
    return 'id';
  });

  const activeLocale = parentContext ? parentContext.locale : localeState;

  const setLocale = (newLocale: Locale) => {
    if (parentContext) {
      parentContext.setLocale(newLocale);
    } else {
      setLocaleState(newLocale);
      try {
        localStorage.setItem('cardiosim_locale', newLocale);
      } catch {}
    }
  };

  const toggleLocale = () => {
    const next = activeLocale === 'id' ? 'en' : 'id';
    setLocale(next);
  };

  const t = useMemo(() => {
    return activeLocale === 'en' ? enTranslations : idTranslations;
  }, [activeLocale]);

  const value = useMemo(() => ({
    locale: activeLocale,
    setLocale,
    t,
    toggleLocale,
  }), [activeLocale, t]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    // Default fallback to Indonesian if used outside provider
    return {
      locale: 'id',
      setLocale: () => {},
      t: idTranslations,
      toggleLocale: () => {},
    };
  }
  return context;
}

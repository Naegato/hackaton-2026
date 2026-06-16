import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  DEFAULT_LOCALE,
  isLocaleCode,
  translate,
  type LocaleCode,
  type TranslationKey,
} from '@/lib/i18n';
import { getItem, setItem } from '@/lib/storage';

const LOCALE_KEY = 'app_locale';

type LocaleState = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  /** Traduit une clé UI dans la langue courante. */
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleState | undefined>(undefined);

/** Langue par défaut au tout premier lancement : langue de l'appareil/navigateur si supportée, sinon français. */
function detectInitialLocale(): LocaleCode {
  if (Platform.OS === 'web') {
    const nav = globalThis.navigator?.language?.slice(0, 2);
    if (isLocaleCode(nav)) return nav;
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectInitialLocale);

  // Réhydrate le choix persisté au démarrage
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await getItem(LOCALE_KEY);
      if (active && isLocaleCode(stored)) setLocaleState(stored);
    })();
    return () => {
      active = false;
    };
  }, []);

  function setLocale(next: LocaleCode) {
    setLocaleState(next);
    // persistance best-effort (pas besoin d'attendre)
    void setItem(LOCALE_KEY, next);
  }

  const value = useMemo<LocaleState>(
    () => ({ locale, setLocale, t: (key) => translate(locale, key) }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleState {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale doit être utilisé dans un <LocaleProvider>');
  return ctx;
}

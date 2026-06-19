/**
 * Internationalisation des chaînes de l'interface (UI).
 * À ne pas confondre avec le contenu localisé (pages FAQ/CGU…) qui vient de l'API Payload via ?locale=.
 *
 * Les codes de langue sont alignés sur le back (cf. apps/content/src/locales.ts).
 *
 * Un dictionnaire par langue, dans son propre fichier (fr.ts / en.ts / es.ts / zh.ts),
 * pour garder chaque traduction lisible et limiter la taille des diffs.
 */
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import type { Dictionary } from './types';
import { zh } from './zh';

export const LOCALES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'fr';

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return !!value && (LOCALE_CODES as readonly string[]).includes(value);
}

export const translations: Record<LocaleCode, Dictionary> = { fr, en, es, zh };

export type TranslationKey = keyof typeof fr;

/** Traduit une clé pour une locale donnée, avec repli sur le français puis sur la clé brute. */
export function translate(locale: LocaleCode, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}

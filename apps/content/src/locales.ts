/**
 * Langues gérées par le back.
 * Le français est la langue par défaut ; les autres retombent dessus si une traduction manque (fallback).
 * Partagé entre la config Payload et l'endpoint /api/locales (le front peut ainsi lister les langues).
 */
export const locales = [
  { label: 'Français', code: 'fr' },
  { label: 'English', code: 'en' },
  { label: 'Español', code: 'es' },
  { label: '中文', code: 'zh' },
] as const

export const defaultLocale = 'fr'

export type LocaleCode = (typeof locales)[number]['code']

export const localeCodes: LocaleCode[] = locales.map((l) => l.code)

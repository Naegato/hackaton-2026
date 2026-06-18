import type { TranslationKey } from './i18n';

/**
 * Offres disposant d'un descriptif court (« pour qui ? quelles spécificités ? »).
 * Le texte est localisé dans i18n sous la clé `planDesc.<slug>`.
 * On enrichit cette liste offre par offre.
 */
const DESCRIBED_SLUGS = new Set<string>([
  'imagine-r-junior',
  'imagine-r-scolaire',
  'imagine-r-etudiant',
  'navigo-annuel',
  'navigo-mois',
  'navigo-semaine',
  'navigo-senior',
  'navigo-liberte-plus',
  'solidarite-transport',
  'amethyste',
]);

/** Clé i18n du descriptif d'une offre, ou null si l'offre n'en a pas encore. */
export function planDescriptionKey(slug: string): TranslationKey | null {
  return DESCRIBED_SLUGS.has(slug) ? (`planDesc.${slug}` as TranslationKey) : null;
}

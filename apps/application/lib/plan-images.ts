import type { ImageSourcePropType } from 'react-native';

import { BASE_URL, type RecommendationResult } from './api';
import type { TranslationKey } from './i18n';

type Plan = RecommendationResult['plans'][number];

/**
 * Illustrations locales des abonnements (fournies dans assets/images/images, nommées par slug).
 * Metro exige des chemins `require` littéraux → table statique.
 * Une offre sans entrée ici retombe sur l'image média renvoyée par l'API.
 */
export const PLAN_IMAGES: Record<string, ImageSourcePropType> = {
  'navigo-mois': require('../assets/images/images/navigo-mois.png'),
  'navigo-annuel': require('../assets/images/images/navigo-annuel.png'),
  'navigo-semaine': require('../assets/images/images/navigo-semaine.png'),
  'navigo-senior': require('../assets/images/images/navigo-senior.png'),
  'navigo-liberte-plus': require('../assets/images/images/navigo-liberte-plus.png'),
  'imagine-r-junior': require('../assets/images/images/imagine-r-junior.png'),
  'imagine-r-scolaire': require('../assets/images/images/imagine-r-scolaire.png'),
  'imagine-r-etudiant': require('../assets/images/images/imagine-r-etudiant.png'),
  'solidarite-transport': require('../assets/images/images/solidarite-transport.png'),
  amethyste: require('../assets/images/images/amethyste.png'),
};

/** Source d'image d'une offre : illustration locale prioritaire, sinon média de l'API. */
export function planImageSource(plan: Plan): ImageSourcePropType | null {
  const local = PLAN_IMAGES[plan.slug];
  if (local) return local;
  if (!plan.image) return null;
  const uri = plan.image.startsWith('http') ? plan.image : `${BASE_URL}${plan.image}`;
  return { uri };
}

/** Libellé de prix formaté : « 90.8 € /mois », ou « Sur dossier » pour les offres à prix 0. */
export function formatPlanPrice(
  plan: Pick<Plan, 'price' | 'period'>,
  t: (key: TranslationKey) => string,
): string {
  if (plan.price === 0) return t('offers.onDossier');
  return `${plan.price} € ${t(('period.' + plan.period) as TranslationKey)}`;
}

import type { ImageSourcePropType } from 'react-native';

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

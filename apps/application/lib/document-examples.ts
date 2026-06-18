import type { ImageSourcePropType } from 'react-native';

import type { DocType } from './api';

/**
 * Images d'exemple par type de document (« voici ce qui est attendu »).
 * Déposez 1 à 2 images dans assets/images/doc-examples/ nommées <type>-1.png / <type>-2.png,
 * puis dé-commentez les require() correspondants (Metro exige des chemins littéraux).
 *
 * Tant qu'aucune image n'est fournie pour un type, le bouton affiche « exemple bientôt disponible ».
 */
export const DOCUMENT_EXAMPLES: Partial<Record<DocType, ImageSourcePropType[]>> = {
  id: [require('../assets/images/images/documents/id-1.png')],
  photo: [require('../assets/images/images/documents/photo-1.png')],
  school: [require('../assets/images/images/documents/school-1.png')],
  // income: [require('../assets/images/images/documents/income-1.png')],
  // cmi: [require('../assets/images/images/documents/cmi-1.png')],
};

export function documentExamples(type: DocType): ImageSourcePropType[] {
  return DOCUMENT_EXAMPLES[type] ?? [];
}

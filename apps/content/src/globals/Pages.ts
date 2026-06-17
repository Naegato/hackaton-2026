import type { GlobalConfig } from 'payload'

import { anyone, isStaff } from '@/access'

/**
 * Fabrique un "global" représentant une page de contenu unique, traduisible.
 * - `title` et `content` sont `localized` → une valeur par langue (fr/en/es/zh).
 * - lecture publique → le front consomme via GET /api/globals/<slug>?locale=<code>.
 */
const createPageGlobal = (slug: string, label: string): GlobalConfig => ({
  slug,
  label,
  access: {
    // Contenu public : accessible sans authentification
    read: anyone,
    update: isStaff,
  },
  admin: {
    group: 'Pages',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
  ],
})

/** Pages institutionnelles attendues par le brief (FAQ, mentions légales, CGU/CGV, confidentialité, aide). */
export const pageGlobals: GlobalConfig[] = [
  createPageGlobal('faq', 'FAQ'),
  createPageGlobal('help', 'Aide'),
  createPageGlobal('terms', "Conditions Générales d'Utilisation"),
  createPageGlobal('sales-terms', 'Conditions Générales de Vente'),
  createPageGlobal('privacy', 'Politique de confidentialité'),
  createPageGlobal('legal-notice', 'Mentions légales'),
]

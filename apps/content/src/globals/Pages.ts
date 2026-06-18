import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'

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
    // Édition réservée aux developer/admin (CGU, FAQ → responsabilité légale)
    update: isAdmin,
  },
  admin: {
    group: 'Pages',
    // Cacher les pages du menu admin pour le SAV (comutitres_manager ne les édite pas)
    hidden: ({ user }) => {
      const roles = (user as { roles?: string[] | null } | null)?.roles ?? []
      return roles.includes('comutitres_manager') && !roles.some((r) => ['developer', 'admin'].includes(r))
    },
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

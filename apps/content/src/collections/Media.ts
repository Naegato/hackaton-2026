import type { CollectionConfig } from 'payload'

import { anyone, isOnlyAdmin } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: anyone,
    create: isOnlyAdmin,
    update: isOnlyAdmin,
    delete: isOnlyAdmin,
  },
  admin: {
    group: 'Médias',
    description: "Fichiers et images utilisés dans le catalogue d'offres.",
    hidden: ({ user }) => {
      const roles = (user as { roles?: string[] | null } | null)?.roles ?? []
      return roles.includes('comutitres_manager') && !roles.some((r) => ['developer', 'admin'].includes(r))
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}

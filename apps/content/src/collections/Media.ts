import type { CollectionConfig } from 'payload'

import { anyone, isStaff } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
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

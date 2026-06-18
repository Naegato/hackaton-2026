import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/roles'
import { createNotification } from '../lib/notifications'
import { NOTIFICATION_TYPES } from './Notifications'

/**
 * Diffusion d'une notification à plusieurs comptes depuis l'admin Payload, sans passer par l'API.
 *
 * Création = envoi immédiat (fan-out vers `notifications`, une notification par destinataire).
 * Modifier une diffusion après coup ne renvoie rien : c'est un objet de campagne, pas un brouillon
 * persistant. `sentCount` est renseigné automatiquement une fois l'envoi terminé.
 */
export const NotificationBroadcasts: CollectionConfig = {
  slug: 'notification-broadcasts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'audience', 'sentCount', 'createdAt'],
    group: 'Utilisateurs',
    description: 'Diffuse une notification (+ email optionnel) à tous les comptes ou à une sélection.',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation !== 'create') return doc

        const recipientIds =
          doc.audience === 'selected'
            ? (doc.recipients ?? []).map((r: unknown) => (r && typeof r === 'object' ? (r as { id: string }).id : r))
            : (
                await req.payload.find({ collection: 'users', limit: 5000, depth: 0, req })
              ).docs.map((u) => u.id)

        for (const userId of recipientIds) {
          await createNotification({
            payload: req.payload,
            req,
            userId: String(userId),
            type: doc.type,
            title: doc.title,
            message: doc.message,
            sendEmail: Boolean(doc.sendEmail),
          })
        }

        await req.payload.update({
          collection: 'notification-broadcasts',
          id: doc.id,
          data: { sentCount: recipientIds.length },
          req,
        })

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'PROMOTION',
      options: [...NOTIFICATION_TYPES],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'audience',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'Tout le monde', value: 'all' },
        { label: 'Destinataires sélectionnés', value: 'selected' },
      ],
    },
    {
      name: 'recipients',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Comptes ciblés (uniquement si audience = "Destinataires sélectionnés")',
        condition: (data) => data?.audience === 'selected',
      },
    },
    {
      name: 'sendEmail',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Envoyer aussi un email à chaque destinataire' },
    },
    {
      name: 'sentCount',
      type: 'number',
      admin: { readOnly: true, description: "Nombre de destinataires notifiés (renseigné après l'envoi)" },
    },
  ],
  timestamps: true,
}
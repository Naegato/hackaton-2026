import type { CollectionConfig } from 'payload'

import { isAuthenticated, isSAVAdminFromUser, isSAVAdminField, ownedBy } from '../access/roles'

type WithRoles = { id: string; roles?: string[] | null } | null

const isSAVAdmin = ({ req }: { req: { user?: unknown } }) =>
  isSAVAdminFromUser(req.user as WithRoles)

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'category', 'status', 'from', 'createdAt'],
    group: 'Support',
    description: "Demandes de support soumises par les utilisateurs via l'application.",
  },
  access: {
    create: isAuthenticated,
    read: ownedBy('from'),
    update: isSAVAdmin,
    delete: ({ req }) => (req.user as WithRoles)?.roles?.includes('admin') ?? false,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.from = (req.user as { id: string }).id
          data.status = 'open'
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'from',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        description: 'Utilisateur ayant soumis le ticket.',
      },
      access: { update: () => false },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Abonnement', value: 'subscription' },
        { label: 'Document à valider', value: 'document' },
        { label: 'Carte perdue / volée', value: 'lost-card' },
        { label: "Transfert d'abonnement", value: 'transfer' },
        { label: 'Facturation', value: 'billing' },
        { label: 'Autre', value: 'other' },
      ],
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      access: { update: () => false },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      access: { update: () => false },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Ouvert', value: 'open' },
        { label: 'En cours', value: 'in-progress' },
        { label: 'Résolu', value: 'resolved' },
        { label: 'Fermé', value: 'closed' },
      ],
      access: { create: isSAVAdminField, update: isSAVAdminField },
    },
    {
      name: 'adminResponse',
      type: 'textarea',
      label: "Réponse de l'équipe",
      admin: {
        description: "Réponse visible par l'utilisateur dans l'application.",
      },
      access: { create: isSAVAdminField, update: isSAVAdminField },
    },
  ],
}

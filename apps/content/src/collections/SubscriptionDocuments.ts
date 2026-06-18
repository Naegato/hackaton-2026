import type { CollectionConfig } from 'payload'

import { isAdminField, isSAVAdminField, isAuthenticated, ownedBy } from '../access/roles'

/**
 * Documents fournis pour une souscription (pièce d'identité, photo, justificatifs…).
 * Collection d'upload dédiée (≠ media public) : lecture restreinte au propriétaire / staff.
 * Le statut (en attente / validé / refusé) et le motif de refus sont gérés par le staff uniquement.
 */
export const SubscriptionDocuments: CollectionConfig = {
  slug: 'subscription-documents',
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'status', 'subscription', 'owner', 'updatedAt'],
    group: 'Abonnements',
    description: "Documents déposés par les usagers pour valider leur souscription.",
  },
  access: {
    create: isAuthenticated,
    read: ownedBy('owner'),
    update: ownedBy('owner'), // le propriétaire peut remplacer un document refusé ; le statut reste staff-only (field access)
    delete: ownedBy('owner'),
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Upload par un utilisateur connecté : on force le propriétaire et le statut « en attente ».
        // En l'absence de req.user (seed / Local API), on respecte owner/status/refusalReason fournis.
        if (operation === 'create' && req.user) {
          data.owner = (req.user as { id?: string }).id
          data.status = 'pending'
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
      access: { update: isAdminField },
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: "Pièce d'identité", value: 'id' },
        { label: "Photo d'identité", value: 'photo' },
        { label: 'Justificatif de scolarité', value: 'school' },
        { label: 'Justificatif de ressources', value: 'income' },
        { label: 'Carte Mobilité Inclusion', value: 'cmi' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'En attente de validation', value: 'pending' },
        { label: 'Validé', value: 'validated' },
        { label: 'Refusé', value: 'refused' },
      ],
      // Admin et comutitres_manager (SAV) peuvent valider ou refuser ; developer lecture seule
      access: { create: isSAVAdminField, update: isSAVAdminField },
    },
    {
      name: 'refusalReason',
      type: 'text',
      admin: { description: "Motif affiché à l'usager en cas de refus" },
      access: { create: isSAVAdminField, update: isSAVAdminField },
    },
  ],
}

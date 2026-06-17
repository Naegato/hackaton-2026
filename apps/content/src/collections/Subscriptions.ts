import type { CollectionConfig } from 'payload'

import { isAdminField, isAuthenticated, isAdminFromUser, ownedBy } from '../access/roles'

/**
 * Abonnement réel géré par un compte.
 *
 * Principe clé : les informations propres à l'abonnement (titulaire réel, carte, dates)
 * sont stockées ICI, indépendamment du compte gestionnaire. Le seul lien transférable
 * est `managedBy`. Le transfert passe par la collection `transfer-requests` (avec acceptation).
 */
export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'cardNumber',
    defaultColumns: ['cardNumber', 'plan', 'managedBy', 'status', 'endDate'],
    group: 'Abonnements',
  },
  access: {
    // Row-level : un compte ne voit/modifie que SES abonnements (sauf admin)
    read: ownedBy('managedBy'),
    update: ownedBy('managedBy'),
    delete: ownedBy('managedBy'),
    create: isAuthenticated,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // À la création, rattache l'abonnement au compte courant (sauf admin qui peut cibler un autre compte)
        if (operation === 'create' && !isAdminFromUser(req.user as never)) {
          data.managedBy = (req.user as { id?: string } | null)?.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'plans',
      required: true,
    },
    {
      name: 'managedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      // Le compte gestionnaire ne se change PAS à la main : il bascule via un transfert accepté.
      access: {
        update: isAdminField,
      },
      admin: { description: 'Compte qui gère actuellement cet abonnement (modifié via un transfert)' },
    },
    {
      name: 'holderFirstName',
      type: 'text',
      admin: { description: 'Prénom du titulaire réel (peut être un proche, ≠ titulaire du compte)' },
    },
    {
      name: 'holderLastName',
      type: 'text',
    },
    {
      name: 'cardNumber',
      type: 'text',
      admin: { description: 'N° de carte / support de l’abonnement' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Actif', value: 'active' },
        { label: 'Expiré', value: 'expired' },
        { label: 'Résilié', value: 'cancelled' },
      ],
    },
    {
      name: 'startDate',
      type: 'date',
    },
    {
      name: 'endDate',
      type: 'date',
    },
    {
      name: 'transferHistory',
      type: 'array',
      label: 'Historique des transferts',
      // Renseigné automatiquement par le hook d'acceptation, non éditable par l'utilisateur
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: { readOnly: true },
      fields: [
        { name: 'fromUser', type: 'relationship', relationTo: 'users' },
        { name: 'toUser', type: 'relationship', relationTo: 'users' },
        { name: 'date', type: 'date' },
      ],
    },
  ],
}

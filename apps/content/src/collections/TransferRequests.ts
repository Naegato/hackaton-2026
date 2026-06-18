import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { isAdmin, isAuthenticated, isStaffFromUser, ownedByAny } from '../access/roles'

/** Normalise une valeur relationnelle (id string ou objet peuplé) en id. */
const toId = (value: unknown): string => {
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: string }).id)
  return String(value)
}

/**
 * Demande de transfert d'un abonnement vers un autre compte, AVEC ACCEPTATION.
 *
 * Flux :
 *  1. Le gestionnaire crée une demande (cible = email d'un autre compte) → statut `pending`.
 *  2. Le destinataire accepte (`accepted`) ou refuse (`declined`) ; l'émetteur peut annuler (`cancelled`).
 *  3. À l'acceptation, le hook bascule `subscription.managedBy` vers le destinataire et écrit l'historique.
 */
export const TransferRequests: CollectionConfig = {
  slug: 'transfer-requests',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['subscription', 'fromUser', 'toUser', 'status', 'respondedAt', 'createdAt'],
    group: 'Abonnements',
    description: "Demandes de transfert d'abonnement entre comptes (avec acceptation obligatoire).",
  },
  access: {
    create: isAuthenticated,
    // Émetteur ET destinataire peuvent voir la demande ; les transitions sont validées dans le hook.
    read: ownedByAny(['fromUser', 'toUser']),
    update: ownedByAny(['fromUser', 'toUser']),
    delete: isAdmin,
  },
  fields: [
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: true,
    },
    {
      name: 'toEmail',
      type: 'email',
      required: true,
      admin: { description: 'Email du compte destinataire du transfert' },
    },
    {
      name: 'fromUser',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, description: 'Émetteur (rempli automatiquement)' },
    },
    {
      name: 'toUser',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, description: 'Destinataire (résolu depuis l’email)' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'En attente', value: 'pending' },
        { label: 'Accepté', value: 'accepted' },
        { label: 'Refusé', value: 'declined' },
        { label: 'Annulé', value: 'cancelled' },
      ],
    },
    {
      name: 'respondedAt',
      type: 'date',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const user = req.user as { id: string; roles?: string[] | null } | null
        const isStaffUser = isStaffFromUser(user)

        if (operation === 'create') {
          // 1. L'émetteur doit gérer l'abonnement ciblé
          const subscription = await req.payload.findByID({
            collection: 'subscriptions',
            id: toId(data.subscription),
            depth: 0,
            req,
          })
          const manager = toId(subscription.managedBy)
          if (!isStaffUser && manager !== user?.id) {
            throw new APIError("Vous ne gérez pas cet abonnement.", 403)
          }
          data.fromUser = manager

          // 2. Résoudre le destinataire depuis l'email
          const email = String(data.toEmail ?? '').trim().toLowerCase()
          const found = await req.payload.find({
            collection: 'users',
            where: { email: { equals: email } },
            depth: 0,
            limit: 1,
            req,
          })
          const target = found.docs[0]
          if (!target) throw new APIError("Aucun compte ne correspond à cet email.", 404)
          if (toId(target.id) === manager) {
            throw new APIError("Vous ne pouvez pas transférer l'abonnement vers vous-même.", 400)
          }
          data.toUser = target.id

          // 3. Une seule demande en attente par abonnement
          const pending = await req.payload.find({
            collection: 'transfer-requests',
            where: {
              and: [{ subscription: { equals: toId(data.subscription) } }, { status: { equals: 'pending' } }],
            },
            depth: 0,
            limit: 1,
            req,
          })
          if (pending.totalDocs > 0) {
            throw new APIError("Un transfert est déjà en attente pour cet abonnement.", 409)
          }

          data.status = 'pending'
          return data
        }

        // operation === 'update' : on valide les transitions de statut
        if (data.status && originalDoc && data.status !== originalDoc.status) {
          if (originalDoc.status !== 'pending') {
            throw new APIError("Cette demande a déjà été traitée.", 409)
          }
          const fromId = toId(originalDoc.fromUser)
          const toUserId = toId(originalDoc.toUser)

          if ((data.status === 'accepted' || data.status === 'declined') && !isStaffUser && user?.id !== toUserId) {
            throw new APIError("Seul le destinataire peut accepter ou refuser.", 403)
          }
          if (data.status === 'cancelled' && !isStaffUser && user?.id !== fromId) {
            throw new APIError("Seul l'émetteur peut annuler.", 403)
          }
          data.respondedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation, context }) => {
        if (context.skipTransferSwap) return doc

        // Bascule de propriété uniquement au passage pending → accepted
        if (operation === 'update' && previousDoc?.status === 'pending' && doc.status === 'accepted') {
          const subId = toId(doc.subscription)
          const subscription = await req.payload.findByID({
            collection: 'subscriptions',
            id: subId,
            depth: 0,
            req,
          })

          const history = Array.isArray(subscription.transferHistory) ? subscription.transferHistory : []

          await req.payload.update({
            collection: 'subscriptions',
            id: subId,
            req,
            data: {
              managedBy: toId(doc.toUser),
              transferHistory: [
                ...history,
                {
                  fromUser: toId(doc.fromUser),
                  toUser: toId(doc.toUser),
                  date: new Date().toISOString(),
                },
              ],
            },
          })
        }
        return doc
      },
    ],
  },
}

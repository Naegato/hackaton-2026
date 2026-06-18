import type { Access, CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { isAdmin, isAdminField, isStaffFromUser } from '../access/roles'
import { createNotification } from '../lib/notifications'
import { buildNotificationEmail } from '../lib/notification-emails'

/**
 * Contrairement à `ownedBy`, ne fait AUCUNE exception pour le staff : une notification est
 * strictement privée à son destinataire. Un admin/developer ne doit voir/modifier que SES
 * propres notifications, jamais celles des autres comptes (même via le panel admin).
 */
const ownNotificationOnly: Access = ({ req }) => {
  const user = req.user as { id: string } | null
  if (!user) return false
  return { user: { equals: user.id } }
}

export const NOTIFICATION_TYPES = [
  { label: 'Expiration imminente', value: 'EXPIRATION_IMMINENT' },
  { label: 'Renouvellement', value: 'RENEWAL' },
  { label: 'Promotion', value: 'PROMOTION' },
  { label: 'Transfert reçu', value: 'TRANSFER_RECEIVED' },
  { label: 'Transfert envoyé', value: 'TRANSFER_SENT' },
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]['value']

/**
 * Notification in-app (+ email optionnel) adressée à un utilisateur.
 *
 * Créée via le service `createNotification` (cf. `src/lib/notifications.ts`), appelé depuis les
 * hooks d'autres collections (transferts, abonnements), depuis `NotificationBroadcasts`, ou
 * directement dans l'admin Payload. L'envoi d'email est géré par le hook `afterChange` ci-dessous
 * — donc déclenché quel que soit le chemin de création (Local API, REST, admin UI). Le seul champ
 * modifiable par le destinataire est `read`.
 */
export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['user', 'type', 'title', 'read', 'createdAt'],
    group: 'Utilisateurs',
    description: 'Notifications in-app envoyées aux utilisateurs.',
  },
  access: {
    read: ownNotificationOnly,
    // Seul `read` est éditable par le destinataire ; le reste est verrouillé au niveau champ.
    update: ownNotificationOnly,
    delete: ownNotificationOnly,
    // Création réservée au staff via l'API REST/GraphQL ; le flux normal passe par le service
    // `createNotification` en Local API (overrideAccess par défaut), appelé depuis des hooks serveur.
    create: isAdmin,
  },
  hooks: {
    afterChange: [
      // Envoie l'email transactionnel à la création, quel que soit le point d'entrée
      // (admin Payload, REST, Local API). Ne se redéclenche jamais sur un update.
      async ({ doc, req, operation }) => {
        if (operation !== 'create' || !doc.sendEmail) return doc
        const userId = typeof doc.user === 'object' ? doc.user?.id : doc.user
        if (!userId) return doc
        const user = await req.payload.findByID({ collection: 'users', id: userId, depth: 0, req })
        if (!user?.email) return doc
        const { subject, html } = buildNotificationEmail(doc.type, { title: doc.title, message: doc.message })
        try {
          await req.payload.sendEmail({ to: user.email, subject, html })
        } catch (err) {
          req.payload.logger.error({ err, msg: `[notifications] Échec d'envoi d'email à ${user.email}` })
        }
        return doc
      },
    ],
  },
  endpoints: [
    {
      // GET /api/notifications/unread-count
      path: '/unread-count',
      method: 'get',
      handler: async (req) => {
        if (!req.user) throw new APIError('Authentification requise.', 401)
        const { totalDocs } = await req.payload.find({
          collection: 'notifications',
          where: { and: [{ user: { equals: req.user.id } }, { read: { equals: false } }] },
          limit: 0,
          depth: 0,
          req,
        })
        return Response.json({ count: totalDocs })
      },
    },
    {
      // POST /api/notifications/mark-all-read
      path: '/mark-all-read',
      method: 'post',
      handler: async (req) => {
        if (!req.user) throw new APIError('Authentification requise.', 401)
        const result = await req.payload.update({
          collection: 'notifications',
          where: { and: [{ user: { equals: req.user.id } }, { read: { equals: false } }] },
          data: { read: true },
          req,
        })
        return Response.json({ updated: result.docs.length })
      },
    },
    {
      // POST /api/notifications/check-expirations?days=7 — staff uniquement.
      // Scanne les abonnements actifs expirant dans la fenêtre donnée et notifie leur gestionnaire
      // (idempotent : ignore les abonnements déjà notifiés dans les 24 dernières heures).
      path: '/check-expirations',
      method: 'post',
      handler: async (req) => {
        if (!isStaffFromUser(req.user as never)) throw new APIError('Accès réservé au staff.', 403)

        const days = Number((req.query as Record<string, string | undefined>)?.days ?? 7)
        const now = new Date()
        const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

        const { docs: subs } = await req.payload.find({
          collection: 'subscriptions',
          where: {
            and: [
              { status: { equals: 'active' } },
              { endDate: { greater_than_equal: now.toISOString() } },
              { endDate: { less_than_equal: horizon.toISOString() } },
            ],
          },
          depth: 0,
          limit: 500,
          req,
        })

        let created = 0
        for (const sub of subs) {
          const managedById = sub.managedBy
          if (!managedById) continue

          const existing = await req.payload.find({
            collection: 'notifications',
            where: {
              and: [
                { user: { equals: managedById } },
                { type: { equals: 'EXPIRATION_IMMINENT' } },
                { createdAt: { greater_than_equal: dayAgo } },
              ],
            },
            depth: 0,
            limit: 1,
            req,
          })
          if (existing.totalDocs > 0) continue

          await createNotification({
            payload: req.payload,
            req,
            userId: String(managedById),
            type: 'EXPIRATION_IMMINENT',
            title: 'Votre abonnement expire bientôt',
            message: sub.endDate
              ? `Votre abonnement arrive à échéance le ${new Date(sub.endDate).toLocaleDateString('fr-FR')}.`
              : 'Votre abonnement arrive bientôt à échéance.',
            metadata: { subscriptionId: sub.id, endDate: sub.endDate },
            sendEmail: true,
          })
          created++
        }

        return Response.json({ scanned: subs.length, created })
      },
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: { update: isAdminField },
      admin: { description: 'Destinataire de la notification' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [...NOTIFICATION_TYPES],
      access: { update: isAdminField },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      access: { update: isAdminField },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      access: { update: isAdminField },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Statut lu / non lu' },
    },
    {
      name: 'sendEmail',
      type: 'checkbox',
      defaultValue: false,
      access: { update: isAdminField },
      admin: { description: "Envoyer aussi un email à la création (n'a aucun effet après coup)" },
    },
    {
      name: 'metadata',
      type: 'json',
      access: { update: isAdminField },
      admin: { description: 'Contexte additionnel (ex. id abonnement, id transfert…)' },
    },
  ],
  timestamps: true,
}
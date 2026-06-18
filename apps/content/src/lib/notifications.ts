import type { Payload, PayloadRequest } from 'payload'

import type { NotificationType } from '../collections/Notifications'

export type CreateNotificationInput = {
  payload: Payload
  /** Requête en cours, à transmettre pour rester dans la même transaction si on est déjà dans un hook. */
  req?: PayloadRequest
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
  /** Envoie en plus un email transactionnel au destinataire. Défaut : false. */
  sendEmail?: boolean
}

/**
 * Point d'entrée unique pour créer une notification (in-app + email optionnel).
 * Réutilisable depuis n'importe quel hook ou endpoint serveur.
 * L'envoi d'email lui-même est géré par le hook `afterChange` de la collection `notifications`,
 * pour rester déclenché même quand une notification est créée directement dans l'admin Payload.
 */
export async function createNotification({
  payload,
  req,
  userId,
  type,
  title,
  message,
  metadata,
  sendEmail = false,
}: CreateNotificationInput) {
  return payload.create({
    collection: 'notifications',
    data: { user: userId, type, title, message, metadata, read: false, sendEmail },
    req,
  })
}
import type { NotificationType } from '../collections/Notifications'

type EmailContent = { subject: string; html: string }

const SUBJECT_PREFIX: Record<NotificationType, string> = {
  EXPIRATION_IMMINENT: 'Votre abonnement expire bientôt',
  RENEWAL: 'Votre abonnement a été renouvelé',
  PROMOTION: 'Une offre IDF Mobilité pour vous',
  TRANSFER_RECEIVED: 'Vous avez reçu une demande de transfert',
  TRANSFER_SENT: 'Votre transfert a été finalisé',
}

const ACCENT_COLOR: Record<NotificationType, string> = {
  EXPIRATION_IMMINENT: '#F59E0B',
  RENEWAL: '#22C55E',
  PROMOTION: '#0D5EBF',
  TRANSFER_RECEIVED: '#3B82F6',
  TRANSFER_SENT: '#22C55E',
}

/**
 * Email transactionnel générique pour une notification.
 * Même style que l'email de réinitialisation de mot de passe (cf. `collections/Users.ts`).
 */
export function buildNotificationEmail(
  type: NotificationType,
  { title, message }: { title: string; message: string },
): EmailContent {
  const accent = ACCENT_COLOR[type]
  const subject = `${SUBJECT_PREFIX[type]} — IDF Mobilité`

  const html = `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2 style="color:${accent};">${title}</h2>
      <p>${message}</p>
      <p style="color:#888;font-size:13px;">Vous recevez cet email car vous êtes inscrit sur IDF Mobilité. Gérez vos notifications dans l'application.</p>
    </div>
  `

  return { subject, html }
}
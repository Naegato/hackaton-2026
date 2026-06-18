import type { PayloadHandler } from 'payload'

/**
 * DELETE /api/delete-account
 *
 * Suppression RGPD conforme (Article 17 + Article 17§3b) :
 *
 *   1. Documents de souscription → supprimés (données personnelles : copies de pièces d'identité)
 *   2. Transferts en attente → supprimés (plus pertinents sans le compte)
 *   3. Abonnements → anonymisés, pas supprimés (obligation légale : Code de commerce L.123-22,
 *      10 ans de conservation des pièces comptables). Le lien vers la personne est coupé.
 *   4. Compte utilisateur → supprimé (email, nom, préférences)
 *
 * Les transferts acceptés/refusés restent en base pour l'audit (références user orphelines acceptables).
 */
const handler: PayloadHandler = async (req) => {
  const user = req.user as { id: string } | null
  if (!user) {
    return Response.json({ message: 'Non authentifié.' }, { status: 401 })
  }

  const userId = user.id

  try {
    // 1. Supprimer les documents de souscription (données personnelles sensibles)
    const documents = await req.payload.find({
      collection: 'subscription-documents',
      where: { owner: { equals: userId } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })

    for (const doc of documents.docs) {
      await req.payload.delete({
        collection: 'subscription-documents',
        id: String(doc.id),
        overrideAccess: true,
      })
    }

    // 2. Supprimer les transferts en attente liés à ce compte
    //    (les transferts terminés restent pour la traçabilité financière)
    const pendingTransfers = await req.payload.find({
      collection: 'transfer-requests',
      where: {
        and: [
          { status: { equals: 'pending' } },
          { or: [{ fromUser: { equals: userId } }, { toUser: { equals: userId } }] },
        ],
      },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })

    for (const transfer of pendingTransfers.docs) {
      await req.payload.delete({
        collection: 'transfer-requests',
        id: String(transfer.id),
        overrideAccess: true,
      })
    }

    // 3. Anonymiser les abonnements (obligation de conservation 10 ans)
    //    On coupe le lien vers la personne mais on garde les données financières.
    const subscriptions = await req.payload.find({
      collection: 'subscriptions',
      where: { managedBy: { equals: userId } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })

    for (const sub of subscriptions.docs) {
      await req.payload.update({
        collection: 'subscriptions',
        id: String(sub.id),
        data: {
          holderFirstName: 'Compte supprimé',
          holderLastName: '',
          status: 'cancelled',
        },
        overrideAccess: true,
      })
    }

    // 4. Supprimer le compte (email, nom, préférences — données personnelles)
    await req.payload.delete({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    })

    return Response.json({ message: 'Compte supprimé.' }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.'
    return Response.json({ message }, { status: 500 })
  }
}

export const deleteAccountEndpoint = {
  path: '/delete-account',
  method: 'delete' as const,
  handler,
}

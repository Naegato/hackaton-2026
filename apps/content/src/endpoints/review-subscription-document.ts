import type { Endpoint } from 'payload'
import { headersWithCors } from 'payload'

import { isSAVAdminFromUser } from '../access/roles'

/**
 * POST /api/subscription-documents/:id/review
 *
 * Validation / refus rapide d'un document depuis la vue admin « Dossiers clients »,
 * sans ouvrir la fiche complète. Réservé au SAV (admin + comutitres_manager).
 */
export const reviewSubscriptionDocument: Endpoint = {
  path: '/subscription-documents/:id/review',
  method: 'post',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers(), req })

    if (!isSAVAdminFromUser(req.user as never)) {
      return Response.json({ error: 'Action réservée au SAV.' }, { status: 403, headers })
    }

    let body: { action?: 'validate' | 'refuse'; refusalReason?: string }
    try {
      if (!req.json) throw new Error('req.json unavailable')
      body = await req.json()
    } catch {
      return Response.json({ error: 'Corps de requête JSON invalide' }, { status: 400, headers })
    }

    const id = req.routeParams?.id as string | undefined
    if (!id) {
      return Response.json({ error: 'Identifiant du document manquant' }, { status: 400, headers })
    }
    if (body.action !== 'validate' && body.action !== 'refuse') {
      return Response.json({ error: "action doit être 'validate' ou 'refuse'" }, { status: 400, headers })
    }
    if (body.action === 'refuse' && !body.refusalReason?.trim()) {
      return Response.json({ error: 'Un motif de refus est requis.' }, { status: 400, headers })
    }

    const doc = await req.payload.update({
      collection: 'subscription-documents',
      id,
      data: {
        status: body.action === 'validate' ? 'validated' : 'refused',
        refusalReason: body.action === 'refuse' ? body.refusalReason!.trim() : null,
      },
      req,
    })

    return Response.json({ doc }, { headers })
  },
}

import type { Endpoint } from 'payload'
import { headersWithCors } from 'payload'

import { isSAVAdminFromUser } from '../access/roles'

/**
 * POST /api/subscription-documents/bulk-validate
 * Body: { ids: string[] }
 *
 * Valide en un clic tous les documents en attente d'un dossier client, depuis la vue
 * admin « Dossiers clients ». Réservé au SAV (admin + comutitres_manager).
 */
export const bulkValidateDocuments: Endpoint = {
  path: '/subscription-documents/bulk-validate',
  method: 'post',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers(), req })

    if (!isSAVAdminFromUser(req.user as never)) {
      return Response.json({ error: 'Action réservée au SAV.' }, { status: 403, headers })
    }

    let body: { ids?: string[] }
    try {
      if (!req.json) throw new Error('req.json unavailable')
      body = await req.json()
    } catch {
      return Response.json({ error: 'Corps de requête JSON invalide' }, { status: 400, headers })
    }

    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === 'string') : []
    if (ids.length === 0) {
      return Response.json({ error: 'ids est requis (tableau non vide)' }, { status: 400, headers })
    }

    const updated = await Promise.all(
      ids.map((id) =>
        req.payload.update({
          collection: 'subscription-documents',
          id,
          data: { status: 'validated', refusalReason: null },
          req,
        }),
      ),
    )

    return Response.json({ docs: updated }, { headers })
  },
}

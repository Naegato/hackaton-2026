import type { Endpoint } from 'payload'
import { headersWithCors } from 'payload'
import { Mistral } from '@mistralai/mistralai'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]

const MAX_BASE64_LENGTH = 7_000_000 // ~5 Mo d'image décodée

/**
 * Vérifie qu'une photo soumise pour un abonnement contient bien un visage humain
 * reconnaissable, via Mistral Vision (solution souveraine française). Ne fait aucune
 * identification ni biométrie : uniquement une classification binaire humain/non-humain
 * pour filtrer les photos invalides avant stockage (logos, paysages, animaux, captures d'écran...).
 */
export const verifyPhoto: Endpoint = {
  path: '/verify-photo',
  method: 'post',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers(), req })

    if (!req.user) {
      return Response.json({ error: 'Authentification requise' }, { status: 401, headers })
    }

    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'Service de vérification non configuré (MISTRAL_API_KEY manquante)' },
        { status: 503, headers },
      )
    }

    let body: { imageBase64?: string; mediaType?: string }
    try {
      if (!req.json) throw new Error('req.json unavailable')
      body = await req.json()
    } catch {
      return Response.json({ error: 'Corps de requête JSON invalide' }, { status: 400, headers })
    }

    const { imageBase64, mediaType } = body
    if (!imageBase64 || !mediaType) {
      return Response.json(
        { error: 'imageBase64 et mediaType sont requis' },
        { status: 400, headers },
      )
    }
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType as AllowedMediaType)) {
      return Response.json(
        { error: `mediaType doit être l'un de : ${ALLOWED_MEDIA_TYPES.join(', ')}` },
        { status: 400, headers },
      )
    }
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return Response.json(
        { error: 'Image trop volumineuse (5 Mo max)' },
        { status: 413, headers },
      )
    }

    try {
      const mistral = new Mistral({ apiKey })
      const response = await mistral.chat.complete({
        model: 'mistral-small-latest',
        temperature: 0.1,
        responseFormat: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  'Cette image va être utilisée comme photo sur une carte d\'abonnement de transport. ' +
                  'Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, au format : ' +
                  '{"isHuman": boolean, "message": string}. ' +
                  '"isHuman" doit être true UNIQUEMENT si l\'image est une photo ORIGINALE (prise directement avec un appareil/smartphone) ' +
                  'montrant clairement le visage d\'une seule personne réelle, cadrée comme une photo d\'identité. ' +
                  'Réponds false dans tous les autres cas, notamment : ' +
                  '- pas de visage humain réel (dessin, logo, paysage, animal, objet) ; ' +
                  '- plusieurs personnes ; ' +
                  '- RECAPTURE : photo prise d\'un écran (téléphone, ordinateur, télévision) ou d\'un tirage papier/photo imprimée. ' +
                  'Indices à détecter pour repérer une recapture : reflets ou éclat lumineux localisé, motif de moiré ou trame de pixels visible, ' +
                  'bords/cadre d\'un écran ou d\'un appareil visibles dans l\'image, courbure ou plis du support, netteté/contraste anormalement faibles, ' +
                  'barre de statut ou interface visible. ' +
                  'En cas de doute sur une recapture, réponds false. ' +
                  '"message" est une phrase courte en français expliquant la décision à l\'utilisateur ' +
                  '(si refusé pour recapture, précise qu\'il faut une photo originale et non une photo d\'écran ou d\'un tirage).',
              },
              {
                type: 'image_url',
                imageUrl: `data:${mediaType};base64,${imageBase64}`,
              },
            ],
          },
        ],
      })

      const raw = response.choices?.[0]?.message?.content
      const text = typeof raw === 'string' ? raw : ''

      let parsed: { isHuman?: boolean; message?: string }
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)
      } catch {
        return Response.json(
          { error: 'Réponse inattendue du service de vérification' },
          { status: 502, headers },
        )
      }

      if (typeof parsed.isHuman !== 'boolean') {
        return Response.json(
          { error: 'Réponse inattendue du service de vérification' },
          { status: 502, headers },
        )
      }

      return Response.json(
        {
          isHuman: parsed.isHuman,
          message: parsed.message ?? (parsed.isHuman ? 'Photo valide.' : 'Photo refusée.'),
        },
        { headers },
      )
    } catch (err) {
      req.payload.logger.error({ err, msg: '[verify-photo] Échec appel Mistral Vision' })
      return Response.json(
        { error: 'Échec de la vérification de la photo' },
        { status: 502, headers },
      )
    }
  },
}

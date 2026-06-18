import type { Endpoint } from 'payload'

import { DEFAULT_ROLE } from '@/access'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

export const googleOAuthRedirect: Endpoint = {
  path: '/oauth/google',
  method: 'get',
  handler: async (req) => {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return Response.json({ error: 'Google OAuth non configuré' }, { status: 503 })
    }
    // L'app mobile passe son URL de retour en query param.
    // On l'encode en base64 dans le `state` Google → récupéré intact au callback.
    const reqUrl = new URL(req.url as string)
    const appRedirect = reqUrl.searchParams.get('redirect') ?? ''
    const state = Buffer.from(appRedirect).toString('base64url')

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    })
    return Response.redirect(`${GOOGLE_AUTH_URL}?${params}`)
  },
}

export const googleOAuthCallback: Endpoint = {
  path: '/oauth/google/callback',
  method: 'get',
  handler: async (req) => {
    // Récupère l'URL de retour depuis le `state` encodé par googleOAuthRedirect.
    // Fallback sur APP_OAUTH_REDIRECT_URI si state absent (tests curl, etc.)
    // Seuls les schemes exp:// et application:// sont acceptés pour éviter les redirections ouvertes.
    let appBase = process.env.APP_OAUTH_REDIRECT_URI ?? 'exp://localhost:8081/--/'
    const fail = `${appBase}?error=oauth_failed`

    try {
      const url = new URL(req.url as string)
      const code = url.searchParams.get('code')
      const rawState = url.searchParams.get('state') ?? ''
      if (rawState) {
        try {
          const decoded = Buffer.from(rawState, 'base64url').toString()
          // exp:// → Expo Go natif  |  application:// → build natif  |  http://localhost → Expo Web dev
        if (
          decoded.startsWith('exp://') ||
          decoded.startsWith('application://') ||
          decoded.startsWith('http://localhost') ||
          decoded.startsWith('https://localhost')
        ) {
          appBase = decoded
        }
        } catch { /* state malformé → on garde le fallback */ }
      }
      if (!code || url.searchParams.get('error')) return Response.redirect(`${appBase}?error=oauth_failed`)

      const clientId = process.env.GOOGLE_CLIENT_ID!
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
      const redirectUri = process.env.GOOGLE_REDIRECT_URI!

      // 1. Exchange authorization code for access token
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })
      if (!tokenRes.ok) return Response.redirect(fail)
      const { access_token } = (await tokenRes.json()) as { access_token: string }

      // 2. Fetch Google user profile
      const profileRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!profileRes.ok) return Response.redirect(fail)
      const profile = (await profileRes.json()) as {
        sub: string
        email: string
        given_name?: string
        family_name?: string
      }
      if (!profile.sub || !profile.email) return Response.redirect(fail)

      // 3. Find or create the Payload user
      let userId: string
      let userEmail: string

      const byGoogle = await req.payload.find({
        collection: 'users',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { googleId: { equals: profile.sub } } as any,
        limit: 1,
        overrideAccess: true,
      })

      if (byGoogle.docs.length > 0) {
        // Known Google user — update profile fields if still empty
        const existing = byGoogle.docs[0]
        userId = existing.id
        userEmail = existing.email
        await req.payload.update({
          collection: 'users',
          id: userId,
          data: {
            firstName: existing.firstName ?? profile.given_name,
            lastName: existing.lastName ?? profile.family_name,
          },
          overrideAccess: true,
        })
      } else {
        const byEmail = await req.payload.find({
          collection: 'users',
          where: { email: { equals: profile.email } },
          limit: 1,
          overrideAccess: true,
        })

        if (byEmail.docs.length > 0) {
          // Existing email account — link Google identity to it
          userId = byEmail.docs[0].id
          userEmail = byEmail.docs[0].email
          await req.payload.update({
            collection: 'users',
            id: userId,
            // Google a déjà vérifié l'email → on marque le compte vérifié (débloque la connexion).
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { googleId: profile.sub, authProvider: 'google', _verified: true } as any,
            overrideAccess: true,
          })
        } else {
          // Brand new user
          const created = await req.payload.create({
            collection: 'users',
            data: {
              email: profile.email,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              googleId: profile.sub as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              authProvider: 'google' as any,
              firstName: profile.given_name,
              lastName: profile.family_name,
              roles: [DEFAULT_ROLE],
              // Email déjà vérifié par Google → compte directement vérifié (sinon la connexion serait bloquée)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              _verified: true as any,
              // Throwaway password — replaced every login by the temp-password bridge below
              password: crypto.randomUUID() + crypto.randomUUID(),
            },
            overrideAccess: true,
          })
          userId = created.id
          userEmail = created.email
        }
      }

      // 4. Temp-password bridge: set a fresh random password then immediately login
      //    This is the only way to obtain a Payload JWT without storing the original password.
      const tempPassword = crypto.randomUUID() + crypto.randomUUID()
      await req.payload.update({
        collection: 'users',
        id: userId,
        data: { password: tempPassword },
        overrideAccess: true,
      })
      const loginResult = await req.payload.login({
        collection: 'users',
        data: { email: userEmail, password: tempPassword },
        req,
      })
      if (!loginResult.token) return Response.redirect(fail)

      // 5. Redirect to the app with the JWT
      return Response.redirect(`${appBase}?token=${loginResult.token}`)
    } catch (err) {
      console.error('[Google OAuth]', err)
      return Response.redirect(fail)
    }
  },
}
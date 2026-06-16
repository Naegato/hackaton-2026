// @vitest-environment node
// Tests backend (Local API Payload) : pas besoin du DOM, on évite jsdom.
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

// Emails dédiés aux tests, nettoyés à la fin (évite de polluer la base de dev).
const TEST_DOMAIN = 'authspec.local'
const email = (name: string) => `${name}.${Date.now()}@${TEST_DOMAIN}`

async function deleteAllTestUsers() {
  await payload.delete({
    collection: 'users',
    where: { email: { like: `@${TEST_DOMAIN}` } },
  })
}

describe('Auth', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await deleteAllTestUsers()
  })

  describe('Inscription', () => {
    it('crée un compte avec le rôle "user" par défaut', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: email('signup'),
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        },
      })

      expect(user.id).toBeDefined()
      expect(user.roles).toEqual(['user'])
    })

    it("empêche un inscrit public de s'auto-attribuer le rôle admin", async () => {
      // overrideAccess: false => le contrôle d'accès du champ `roles` (réservé aux admins) s'applique
      const user = await payload.create({
        collection: 'users',
        data: {
          email: email('escalation'),
          password: 'Password123!',
          roles: ['admin'],
        },
        overrideAccess: false,
      })

      // Le rôle admin demandé est ignoré, on retombe sur la valeur par défaut
      expect(user.roles).toEqual(['user'])
    })

    it('refuse deux comptes avec le même email', async () => {
      const dup = email('dup')
      await payload.create({
        collection: 'users',
        data: { email: dup, password: 'Password123!' },
      })

      await expect(
        payload.create({
          collection: 'users',
          data: { email: dup, password: 'Password123!' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('Connexion', () => {
    it('retourne un token JWT avec les bons identifiants', async () => {
      const userEmail = email('login')
      await payload.create({
        collection: 'users',
        data: { email: userEmail, password: 'Password123!' },
      })

      const result = await payload.login({
        collection: 'users',
        data: { email: userEmail, password: 'Password123!' },
      })

      expect(result.token).toBeTruthy()
      expect(result.user.email).toBe(userEmail)
    })

    it('échoue avec un mauvais mot de passe', async () => {
      const userEmail = email('badpass')
      await payload.create({
        collection: 'users',
        data: { email: userEmail, password: 'Password123!' },
      })

      await expect(
        payload.login({
          collection: 'users',
          data: { email: userEmail, password: 'WRONG' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('Réinitialisation de mot de passe', () => {
    it('génère un token de reset puis permet de changer le mot de passe', async () => {
      const userEmail = email('reset')
      await payload.create({
        collection: 'users',
        data: { email: userEmail, password: 'OldPassword123!' },
      })

      // disableEmail: true => pas d'envoi SMTP, le token est retourné directement
      const token = await payload.forgotPassword({
        collection: 'users',
        data: { email: userEmail },
        disableEmail: true,
      })
      expect(token).toBeTruthy()

      const result = await payload.resetPassword({
        collection: 'users',
        data: { token, password: 'NewPassword123!' },
        overrideAccess: true,
      })
      expect(result.token).toBeTruthy()

      // L'ancien mot de passe ne fonctionne plus, le nouveau oui
      await expect(
        payload.login({
          collection: 'users',
          data: { email: userEmail, password: 'OldPassword123!' },
        }),
      ).rejects.toThrow()

      const relogin = await payload.login({
        collection: 'users',
        data: { email: userEmail, password: 'NewPassword123!' },
      })
      expect(relogin.user.email).toBe(userEmail)
    })
  })
})

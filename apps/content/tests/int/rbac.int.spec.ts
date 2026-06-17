// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

const TEST_DOMAIN = 'rbacspec.local'
const email = (name: string) => `${name}.${Date.now()}.${Math.random().toString(36).slice(2)}@${TEST_DOMAIN}`

async function makeUser(roles: User['roles']): Promise<User> {
  return payload.create({
    collection: 'users',
    data: { email: email('u'), password: 'Password123!', roles },
  })
}

describe('RBAC', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'users',
      where: { email: { like: `@${TEST_DOMAIN}` } },
    })
  })

  describe('Attribution des rôles (anti-escalade)', () => {
    it('un admin peut attribuer un rôle à un autre compte', async () => {
      const admin = await makeUser(['admin'])
      const target = await makeUser(['unsubscribed'])

      const updated = await payload.update({
        collection: 'users',
        id: target.id,
        data: { roles: ['payer'] },
        user: admin,
        overrideAccess: false,
      })

      expect(updated.roles).toEqual(['payer'])
    })

    it("un payer ne peut pas s'auto-promouvoir admin", async () => {
      const payer = await makeUser(['payer'])

      const updated = await payload.update({
        collection: 'users',
        id: payer.id,
        data: { roles: ['admin'] },
        user: payer,
        overrideAccess: false,
      })

      expect(updated.roles).toEqual(['payer'])
    })
  })

  describe('Accès aux comptes (self ou super-utilisateur)', () => {
    it('un utilisateur ne lit que son propre compte', async () => {
      const a = await makeUser(['cardholder'])
      await makeUser(['cardholder'])

      const { docs } = await payload.find({
        collection: 'users',
        user: a,
        overrideAccess: false,
      })

      expect(docs).toHaveLength(1)
      expect(docs[0]?.id).toBe(a.id)
    })

    it('un utilisateur ne peut pas modifier le compte d’un autre', async () => {
      const a = await makeUser(['payer'])
      const b = await makeUser(['cardholder'])

      await expect(
        payload.update({
          collection: 'users',
          id: b.id,
          data: { firstName: 'Hacked' },
          user: a,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('un développeur lit tous les comptes', async () => {
      const dev = await makeUser(['developer'])

      const { totalDocs } = await payload.find({
        collection: 'users',
        user: dev,
        overrideAccess: false,
      })

      expect(totalDocs).toBeGreaterThan(1)
    })
  })

  describe('Gestion de contenu (Pages / Media)', () => {
    it('un comutitres_manager peut éditer une page institutionnelle', async () => {
      const manager = await makeUser(['comutitres_manager'])

      const updated = await payload.updateGlobal({
        slug: 'faq',
        data: { title: 'FAQ mise à jour' },
        user: manager,
        overrideAccess: false,
      })

      expect(updated.title).toBe('FAQ mise à jour')
    })

    it('un payer ne peut pas éditer une page institutionnelle', async () => {
      const payer = await makeUser(['payer'])

      await expect(
        payload.updateGlobal({
          slug: 'faq',
          data: { title: 'Tentative interdite' },
          user: payer,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })
})
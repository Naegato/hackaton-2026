// @vitest-environment node
// Test backend (Local API Payload) : flux de transfert d'abonnement avec acceptation.
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

/** Relationship peuplée (objet) ou id brut → id. */
const relId = (v: unknown): string =>
  v && typeof v === 'object' && 'id' in v ? String((v as { id: string }).id) : String(v)

const DOMAIN = 'transferspec.local'
const created = { users: [] as string[], subs: [] as string[], transfers: [] as string[], plans: [] as string[] }

async function makeUser(name: string) {
  const u = await payload.create({
    collection: 'users',
    data: { email: `${name}.${Date.now()}@${DOMAIN}`, password: 'Password123!' },
  })
  created.users.push(u.id)
  return u
}

describe('Transfert d’abonnement (avec acceptation)', () => {
  let owner: Awaited<ReturnType<typeof makeUser>>
  let recipient: Awaited<ReturnType<typeof makeUser>>
  let stranger: Awaited<ReturnType<typeof makeUser>>
  let planId: string
  let subId: string

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    owner = await makeUser('owner')
    recipient = await makeUser('recipient')
    stranger = await makeUser('stranger')

    const plan = await payload.create({
      collection: 'plans',
      data: { name: 'Test Plan', slug: `test-${Date.now()}`, price: 10, period: 'monthly' },
    })
    planId = plan.id
    created.plans.push(plan.id)

    // L'abonnement est créé par owner (managedBy forcé sur lui via le hook)
    const sub = await payload.create({
      collection: 'subscriptions',
      data: { plan: planId, managedBy: owner.id, holderFirstName: 'Léa', cardNumber: 'CARD-1' },
      user: owner,
      overrideAccess: false,
    })
    subId = sub.id
    created.subs.push(sub.id)
  })

  afterAll(async () => {
    for (const id of created.transfers) await payload.delete({ collection: 'transfer-requests', id }).catch(() => {})
    for (const id of created.subs) await payload.delete({ collection: 'subscriptions', id }).catch(() => {})
    for (const id of created.plans) await payload.delete({ collection: 'plans', id }).catch(() => {})
    await payload.delete({ collection: 'users', where: { email: { like: `@${DOMAIN}` } } })
  })

  it('rattache bien l’abonnement à son créateur', async () => {
    const sub = await payload.findByID({ collection: 'subscriptions', id: subId, depth: 0 })
    expect(String(sub.managedBy)).toBe(owner.id)
  })

  it('refuse un transfert vers soi-même', async () => {
    await expect(
      payload.create({
        collection: 'transfer-requests',
        data: { subscription: subId, toEmail: owner.email },
        user: owner,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('refuse une demande créée par un non-gestionnaire', async () => {
    await expect(
      payload.create({
        collection: 'transfer-requests',
        data: { subscription: subId, toEmail: recipient.email },
        user: stranger,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('crée une demande en attente et résout le destinataire depuis l’email', async () => {
    const tr = await payload.create({
      collection: 'transfer-requests',
      data: { subscription: subId, toEmail: recipient.email },
      user: owner,
      overrideAccess: false,
    })
    created.transfers.push(tr.id)

    expect(tr.status).toBe('pending')
    expect(relId(tr.fromUser)).toBe(owner.id)
    expect(relId(tr.toUser)).toBe(recipient.id)
  })

  it('empêche un tiers (ni émetteur ni destinataire) d’accepter', async () => {
    const trId = created.transfers[0]
    // stranger n'a même pas accès en lecture/écriture → l'update échoue
    await expect(
      payload.update({
        collection: 'transfer-requests',
        id: trId,
        data: { status: 'accepted' },
        user: stranger,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('bascule la propriété quand le destinataire accepte', async () => {
    const trId = created.transfers[0]
    await payload.update({
      collection: 'transfer-requests',
      id: trId,
      data: { status: 'accepted' },
      user: recipient,
      overrideAccess: false,
    })

    const sub = await payload.findByID({ collection: 'subscriptions', id: subId, depth: 0 })
    expect(relId(sub.managedBy)).toBe(recipient.id) // le compte gestionnaire a changé
    expect(sub.transferHistory?.length).toBe(1) // historique écrit
    expect(relId(sub.transferHistory?.[0]?.fromUser)).toBe(owner.id)
    expect(relId(sub.transferHistory?.[0]?.toUser)).toBe(recipient.id)

    // Les infos propres à l'abonnement n'ont pas bougé
    expect(sub.holderFirstName).toBe('Léa')
    expect(sub.cardNumber).toBe('CARD-1')
  })
})

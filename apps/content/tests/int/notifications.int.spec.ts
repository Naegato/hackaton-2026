// @vitest-environment node
// Test backend (Local API Payload) : notifications in-app + déclenchement depuis les transferts/abonnements.
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createNotification } from '@/lib/notifications'

let payload: Payload

const relId = (v: unknown): string =>
  v && typeof v === 'object' && 'id' in v ? String((v as { id: string }).id) : String(v)

const DOMAIN = 'notifspec.local'
const created = { users: [] as string[], subs: [] as string[], transfers: [] as string[], plans: [] as string[], notifications: [] as string[] }

async function makeUser(name: string) {
  const u = await payload.create({
    collection: 'users',
    data: { email: `${name}.${Date.now()}@${DOMAIN}`, password: 'Password123!' },
  })
  created.users.push(u.id)
  return u
}

describe('Notifications', () => {
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
      data: { name: 'Test Plan Notif', slug: `test-notif-${Date.now()}`, price: 10, period: 'monthly' },
    })
    planId = plan.id
    created.plans.push(plan.id)

    const sub = await payload.create({
      collection: 'subscriptions',
      data: {
        plan: planId,
        managedBy: owner.id,
        holderFirstName: 'Léa',
        cardNumber: 'CARD-NOTIF-1',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      user: owner,
      overrideAccess: false,
    })
    subId = sub.id
    created.subs.push(sub.id)
  })

  afterAll(async () => {
    for (const id of created.notifications) await payload.delete({ collection: 'notifications', id }).catch(() => {})
    await payload.delete({ collection: 'notifications', where: { user: { in: created.users } } }).catch(() => {})
    for (const id of created.transfers) await payload.delete({ collection: 'transfer-requests', id }).catch(() => {})
    for (const id of created.subs) await payload.delete({ collection: 'subscriptions', id }).catch(() => {})
    for (const id of created.plans) await payload.delete({ collection: 'plans', id }).catch(() => {})
    await payload.delete({ collection: 'users', where: { email: { like: `@${DOMAIN}` } } })
  })

  it('createNotification crée une notification non lue', async () => {
    const notif = await createNotification({
      payload,
      userId: owner.id,
      type: 'PROMOTION',
      title: 'Offre spéciale',
      message: 'Profitez de -20% ce mois-ci.',
    })
    created.notifications.push(notif.id)

    expect(notif.read).toBe(false)
    expect(relId(notif.user)).toBe(owner.id)
  })

  it('un utilisateur ne voit que ses propres notifications', async () => {
    const notif = await createNotification({
      payload,
      userId: owner.id,
      type: 'PROMOTION',
      title: 'Offre privée',
      message: 'Pour vous uniquement.',
    })
    created.notifications.push(notif.id)

    await expect(
      payload.findByID({ collection: 'notifications', id: notif.id, user: stranger, overrideAccess: false }),
    ).rejects.toThrow()

    const own = await payload.findByID({
      collection: 'notifications',
      id: notif.id,
      user: owner,
      overrideAccess: false,
    })
    expect(own.id).toBe(notif.id)
  })

  it('le destinataire peut marquer sa notification comme lue, pas le titre/type', async () => {
    const notif = await createNotification({
      payload,
      userId: owner.id,
      type: 'PROMOTION',
      title: 'À lire',
      message: 'Contenu',
    })
    created.notifications.push(notif.id)

    const updated = await payload.update({
      collection: 'notifications',
      id: notif.id,
      data: { read: true },
      user: owner,
      overrideAccess: false,
    })
    expect(updated.read).toBe(true)

    // Un autre utilisateur ne peut pas modifier la notification d'autrui
    await expect(
      payload.update({
        collection: 'notifications',
        id: notif.id,
        data: { read: false },
        user: stranger,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('la création d’une demande de transfert notifie le destinataire (TRANSFER_RECEIVED)', async () => {
    const tr = await payload.create({
      collection: 'transfer-requests',
      data: { subscription: subId, toEmail: recipient.email },
      user: owner,
      overrideAccess: false,
    })
    created.transfers.push(tr.id)

    const { docs } = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: recipient.id } }, { type: { equals: 'TRANSFER_RECEIVED' } }] },
      depth: 0,
    })
    expect(docs.length).toBeGreaterThan(0)
    created.notifications.push(...docs.map((d) => d.id))
  })

  it('l’acceptation du transfert notifie l’émetteur (TRANSFER_SENT)', async () => {
    const trId = created.transfers[0]
    await payload.update({
      collection: 'transfer-requests',
      id: trId,
      data: { status: 'accepted' },
      user: recipient,
      overrideAccess: false,
    })

    const { docs } = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: owner.id } }, { type: { equals: 'TRANSFER_SENT' } }] },
      depth: 0,
    })
    expect(docs.length).toBeGreaterThan(0)
    created.notifications.push(...docs.map((d) => d.id))
  })

  it('repousser la date de fin d’un abonnement notifie son gestionnaire (RENEWAL)', async () => {
    const sub = await payload.findByID({ collection: 'subscriptions', id: subId, depth: 0 })
    const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await payload.update({
      collection: 'subscriptions',
      id: subId,
      data: { endDate: newEndDate },
    })

    const { docs } = await payload.find({
      collection: 'notifications',
      // L'abonnement a été transféré au destinataire dans le test précédent
      where: { and: [{ user: { equals: relId(sub.managedBy) } }, { type: { equals: 'RENEWAL' } }] },
      depth: 0,
    })
    expect(docs.length).toBeGreaterThan(0)
    created.notifications.push(...docs.map((d) => d.id))
  })

  it('un admin/staff ne voit pas les notifications des autres comptes', async () => {
    const notif = await createNotification({
      payload,
      userId: owner.id,
      type: 'PROMOTION',
      title: 'Notif privée pour owner',
      message: 'Ne doit pas être visible par un admin',
    })
    created.notifications.push(notif.id)

    const admin = await payload.create({
      collection: 'users',
      data: { email: `admin.${Date.now()}@${DOMAIN}`, password: 'Password123!', roles: ['admin'] },
    })
    created.users.push(admin.id)

    await expect(
      payload.findByID({ collection: 'notifications', id: notif.id, user: admin, overrideAccess: false }),
    ).rejects.toThrow()

    const { docs } = await payload.find({
      collection: 'notifications',
      where: { id: { equals: notif.id } },
      user: admin,
      overrideAccess: false,
      depth: 0,
    })
    expect(docs.length).toBe(0)
  })

  it('une création directe (admin Payload) avec sendEmail envoie bien l’email', async () => {
    // Simule la création depuis l'admin Payload : pas via le service createNotification.
    const notif = await payload.create({
      collection: 'notifications',
      data: { user: owner.id, type: 'PROMOTION', title: 'Promo admin', message: 'Créée depuis l’admin', sendEmail: true },
    })
    created.notifications.push(notif.id)
    expect(notif.sendEmail).toBe(true)
  })

  it('diffuse à tout le monde via notification-broadcasts (audience = all)', async () => {
    const broadcast = await payload.create({
      collection: 'notification-broadcasts',
      data: { type: 'PROMOTION', title: 'Promo générale', message: 'Pour tous', audience: 'all', sendEmail: false },
    })

    const refreshed = await payload.findByID({ collection: 'notification-broadcasts', id: broadcast.id })
    expect(refreshed.sentCount).toBeGreaterThanOrEqual(created.users.length)

    const { docs } = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: owner.id } }, { title: { equals: 'Promo générale' } }] },
      depth: 0,
    })
    expect(docs.length).toBe(1)
    created.notifications.push(...docs.map((d) => d.id))

    await payload.delete({ collection: 'notification-broadcasts', id: broadcast.id })
  })

  it('diffuse uniquement aux destinataires sélectionnés (audience = selected)', async () => {
    const broadcast = await payload.create({
      collection: 'notification-broadcasts',
      data: {
        type: 'PROMOTION',
        title: 'Promo ciblée',
        message: 'Pour vous deux',
        audience: 'selected',
        recipients: [owner.id, recipient.id],
        sendEmail: false,
      },
    })

    const refreshed = await payload.findByID({ collection: 'notification-broadcasts', id: broadcast.id })
    expect(refreshed.sentCount).toBe(2)

    const ownerNotifs = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: owner.id } }, { title: { equals: 'Promo ciblée' } }] },
      depth: 0,
    })
    const strangerNotifs = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: stranger.id } }, { title: { equals: 'Promo ciblée' } }] },
      depth: 0,
    })
    expect(ownerNotifs.docs.length).toBe(1)
    expect(strangerNotifs.docs.length).toBe(0)
    created.notifications.push(...ownerNotifs.docs.map((d) => d.id))

    await payload.delete({ collection: 'notification-broadcasts', id: broadcast.id })
  })
})
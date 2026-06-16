// @vitest-environment node
// Test backend (Local API Payload) : pas besoin du DOM, on évite jsdom.
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('Localization', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('stocke et renvoie le titre selon la locale demandée', async () => {
    // Écrit la version française
    await payload.updateGlobal({
      slug: 'faq',
      locale: 'fr',
      data: { title: 'Foire aux questions' },
    })
    // Écrit la version anglaise (même champ, autre langue)
    await payload.updateGlobal({
      slug: 'faq',
      locale: 'en',
      data: { title: 'Frequently asked questions' },
    })

    const fr = await payload.findGlobal({ slug: 'faq', locale: 'fr' })
    const en = await payload.findGlobal({ slug: 'faq', locale: 'en' })

    expect(fr.title).toBe('Foire aux questions')
    expect(en.title).toBe('Frequently asked questions')
  })

  it('retombe sur le français (defaultLocale) quand une traduction manque', async () => {
    await payload.updateGlobal({
      slug: 'help',
      locale: 'fr',
      data: { title: 'Aide' },
    })
    // On ne crée volontairement PAS la version espagnole

    const es = await payload.findGlobal({ slug: 'help', locale: 'es' })

    // fallback: true → on récupère la valeur française
    expect(es.title).toBe('Aide')
  })
})

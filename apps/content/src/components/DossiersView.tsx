import { DefaultTemplate } from '@payloadcms/next/templates'
import type { InitPageResult } from 'payload'
import React from 'react'

type ViewProps = {
  initPageResult: InitPageResult
  params?: Record<string, string | string[]>
  searchParams?: Record<string, string | string[]>
}

type Owner = { id: string; email: string; firstName?: string | null; lastName?: string | null }
type DocStatus = 'pending' | 'validated' | 'refused'
type DocType = 'id' | 'photo' | 'school' | 'income' | 'cmi'

const STATUS_COLOR: Record<DocStatus, string> = {
  pending: '#d97706',
  validated: '#16a34a',
  refused: '#dc2626',
}
const STATUS_BG: Record<DocStatus, string> = {
  pending: '#fef3c7',
  validated: '#dcfce7',
  refused: '#fee2e2',
}
const STATUS_LABEL: Record<DocStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  refused: 'Refusé',
}
const TYPE_LABEL: Partial<Record<DocType, string>> = {
  id: "Pièce d'identité",
  photo: 'Photo',
  school: 'Scolarité',
  income: 'Ressources',
  cmi: 'CMI',
}

function Badge({ status }: { status: DocStatus }) {
  return (
    <span style={{
      display: 'inline-block',
      background: STATUS_BG[status],
      color: STATUS_COLOR[status],
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 99,
      marginTop: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export default async function DossiersView({ initPageResult, params, searchParams }: ViewProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const { user, payload, i18n } = req

  if (!user) return null

  const result = await payload.find({
    collection: 'subscription-documents',
    depth: 2,
    limit: 500,
    overrideAccess: true,
  })

  // Regroupement par propriétaire
  const byOwner = new Map<string, { owner: Owner; docs: typeof result.docs }>()

  for (const doc of result.docs) {
    const owner = doc.owner as Owner | null | string
    if (!owner || typeof owner === 'string') continue
    const ownerId = String(owner.id)
    if (!byOwner.has(ownerId)) byOwner.set(ownerId, { owner, docs: [] })
    byOwner.get(ownerId)!.docs.push(doc)
  }

  const dossiers = Array.from(byOwner.values()).sort((a, b) => {
    const ap = a.docs.some((d) => d.status === 'pending') ? 0 : 1
    const bp = b.docs.some((d) => d.status === 'pending') ? 0 : 1
    return ap - bp
  })

  const totalPending = result.docs.filter((d) => d.status === 'pending').length

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      <div style={{ padding: '32px 40px', fontFamily: 'system-ui, sans-serif', maxWidth: 960 }}>
        {/* En-tête */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Dossiers clients
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
            {dossiers.length} client{dossiers.length !== 1 ? 's' : ''}
            {totalPending > 0 && (
              <span style={{ marginLeft: 12, background: '#fef3c7', color: '#d97706', fontWeight: 600, padding: '2px 10px', borderRadius: 99, fontSize: 12 }}>
                {totalPending} en attente
              </span>
            )}
          </p>
        </div>

        {dossiers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af', fontSize: 14 }}>
            Aucun document à traiter.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dossiers.map(({ owner, docs }) => {
            const pending = docs.filter((d) => d.status === 'pending').length
            const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || '—'

            return (
              <div key={owner.id} style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {/* Header dossier */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: pending > 0 ? '#fffbeb' : '#fff',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{fullName}</div>
                    <a href={`/admin/collections/users/${owner.id}`}
                      style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
                      {owner.email}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {pending > 0 && (
                      <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>
                        {pending} en attente
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>
                      {docs.length} doc{docs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Documents */}
                <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {docs.map((doc) => {
                    const status = (doc.status ?? 'pending') as DocStatus
                    const type = doc.type as DocType
                    return (
                      <a key={String(doc.id)}
                        href={`/admin/collections/subscription-documents/${doc.id}`}
                        style={{
                          display: 'block',
                          border: `1.5px solid ${status === 'pending' ? '#fcd34d' : '#e5e7eb'}`,
                          borderRadius: 10,
                          padding: '12px 16px',
                          textDecoration: 'none',
                          minWidth: 150,
                          background: status === 'pending' ? '#fffdf0' : '#fafafa',
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                          {TYPE_LABEL[type] ?? type}
                        </div>
                        <Badge status={status} />
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DefaultTemplate>
  )
}

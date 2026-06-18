import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import configPromise from '@payload-config'

type KpiCardProps = {
  label: string
  value: number | string
  accent?: string
}

function KpiCard({ label, value, accent = '#0a7ea4' }: KpiCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '24px 28px',
        minWidth: 180,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{label}</div>
    </div>
  )
}

type SectionProps = { title: string; children: React.ReactNode }

function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

export default async function Dashboard() {
  const headers = await nextHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) return null

  const roles: string[] = (user as { roles?: string[] }).roles ?? []
  const isSuperAdmin = roles.some((r) => ['developer', 'admin'].includes(r))
  const isSAV = roles.includes('comutitres_manager') && !isSuperAdmin

  const [activeSubs, pendingTransfers, totalUsers, cancelledSubs, pendingDocs, pendingSubs, openTickets] = await Promise.all([
    payload.count({ collection: 'subscriptions', where: { status: { equals: 'active' } } }),
    payload.count({ collection: 'transfer-requests', where: { status: { equals: 'pending' } } }),
    isSuperAdmin ? payload.count({ collection: 'users' }) : Promise.resolve({ totalDocs: 0 }),
    payload.count({ collection: 'subscriptions', where: { status: { equals: 'cancelled' } } }),
    payload.count({ collection: 'subscription-documents', where: { status: { equals: 'pending' } } }),
    payload.count({ collection: 'subscriptions', where: { status: { equals: 'pending' } } }),
    payload.count({ collection: 'tickets' as 'users', where: { status: { in: ['open', 'in-progress'] } } }),
  ])

  const roleLabels: Record<string, string> = {
    developer: 'Développeur',
    admin: 'Administrateur',
    comutitres_manager: 'Gestionnaire SAV',
  }
  const roleLabel = roles.map((r) => roleLabels[r] ?? r).join(', ')

  return (
    <div style={{ padding: '32px 40px', fontFamily: 'system-ui, sans-serif', maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Connecté en tant que <strong>{user.email}</strong> — {roleLabel}
        </p>
      </div>

      {/* KPIs SAV — visibles par tous les staff */}
      <Section title="Abonnements">
        <KpiCard label="Actifs" value={activeSubs.totalDocs} accent="#16a34a" />
        <KpiCard label="En attente de validation" value={pendingSubs.totalDocs} accent="#d97706" />
        <KpiCard label="Résiliés" value={cancelledSubs.totalDocs} accent="#dc2626" />
      </Section>

      <Section title="Documents à traiter">
        <KpiCard label="Documents en attente" value={pendingDocs.totalDocs} accent="#7c3aed" />
        <KpiCard label="Transferts en attente" value={pendingTransfers.totalDocs} accent="#d97706" />
        <KpiCard label="Tickets ouverts" value={openTickets.totalDocs} accent="#0891b2" />
      </Section>

      {/* KPIs réservés developer/admin */}
      {isSuperAdmin && (
        <Section title="Utilisateurs">
          <KpiCard label="Comptes inscrits" value={totalUsers.totalDocs} />
        </Section>
      )}

      {/* Liens rapides contextuels */}
      <div style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Accès rapides
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <QuickLink href="/admin/dossiers" label="Dossiers clients" />
          <QuickLink href="/admin/collections/subscriptions" label="Abonnements" />
          <QuickLink href="/admin/collections/tickets" label="Tickets support" />
          <QuickLink href="/admin/collections/transfer-requests" label="Transferts" />
          {isSuperAdmin && <QuickLink href="/admin/collections/users" label="Utilisateurs" />}
          {isSuperAdmin && <QuickLink href="/admin/collections/plans" label="Catalogue d'offres" />}
        </div>
      </div>

      {isSAV && (
        <div style={{ marginTop: 32, padding: '14px 18px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: 13, color: '#1d4ed8' }}>
          Vous avez accès au périmètre SAV : abonnements, transferts et consultation des comptes.
        </div>
      )}
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        padding: '8px 16px',
        background: '#f3f4f6',
        borderRadius: 8,
        fontSize: 13,
        color: '#374151',
        textDecoration: 'none',
        border: '1px solid #e5e7eb',
        fontWeight: 500,
      }}
    >
      {label} →
    </a>
  )
}

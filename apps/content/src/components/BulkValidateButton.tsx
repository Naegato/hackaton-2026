'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  pendingIds: string[]
}

/** Valide en un clic tous les documents en attente d'un dossier client. */
export function BulkValidateButton({ pendingIds }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (pendingIds.length === 0) return null

  async function bulkValidate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/subscription-documents/bulk-validate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: pendingIds }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la requête.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        disabled={busy}
        onClick={bulkValidate}
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#16a34a',
          background: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: 99,
          padding: '4px 12px',
          cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}>
        ✓ Tout valider ({pendingIds.length})
      </button>
      {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type Props = {
  documentId: string
}

/** Boutons Valider / Refuser inline pour une carte document, sans ouvrir la fiche. */
export function DocumentReviewActions({ documentId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [refusing, setRefusing] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function review(action: 'validate' | 'refuse', refusalReason?: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/subscription-documents/${documentId}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, refusalReason }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      setRefusing(false)
      setReason('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la requête.')
    } finally {
      setBusy(false)
    }
  }

  if (refusing) {
    return (
      <div onClick={(e) => e.preventDefault()} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motif du refus…"
          style={{
            fontSize: 12,
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            width: 160,
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            disabled={busy || !reason.trim()}
            onClick={() => review('refuse', reason)}
            style={btnStyle('#dc2626', busy || !reason.trim())}>
            Confirmer
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setRefusing(false)
              setReason('')
              setError(null)
            }}
            style={btnStyle('#6b7280', busy)}>
            Annuler
          </button>
        </div>
        {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div onClick={(e) => e.preventDefault()} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" disabled={busy} onClick={() => review('validate')} style={btnStyle('#16a34a', busy)}>
          ✓ Valider
        </button>
        <button type="button" disabled={busy} onClick={() => setRefusing(true)} style={btnStyle('#dc2626', busy)}>
          ✕ Refuser
        </button>
      </div>
      {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
    </div>
  )
}

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: color,
    border: 'none',
    borderRadius: 6,
    padding: '5px 10px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}

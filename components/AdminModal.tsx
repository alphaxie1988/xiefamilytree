'use client'

import { useState, useEffect } from 'react'
import { TrashIcon } from './Icons'

interface Props {
  isDark: boolean
  currentUserEmail: string
  onClose: () => void
}

export function AdminModal({ isDark, currentUserEmail, onClose }: Props) {
  const [admins, setAdmins] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const D = isDark ? {
    modal:   'bg-gray-800 border-gray-700',
    header:  'border-gray-700',
    title:   'text-white',
    label:   'text-gray-400',
    row:     'border-gray-700',
    email:   'text-gray-200',
    input:   'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500',
    close:   'text-gray-600 hover:text-gray-300',
  } : {
    modal:   'bg-white border-gray-200',
    header:  'border-gray-200',
    title:   'text-gray-900',
    label:   'text-gray-500',
    row:     'border-gray-100',
    email:   'text-gray-700',
    input:   'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400',
    close:   'text-gray-400 hover:text-gray-600',
  }

  useEffect(() => {
    fetch('/api/admins')
      .then(r => r.json())
      .then(data => setAdmins((data as { email: string }[]).map(a => a.email)))
      .catch(() => setError('Failed to load admins'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) { setError('Enter a valid email'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setAdmins(prev => [...prev, email].sort())
      setNewEmail('')
    } else {
      const body = await res.json()
      setError(body.error ?? 'Failed to add admin')
    }
    setSaving(false)
  }

  async function handleRemove(email: string) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admins/${encodeURIComponent(email)}`, { method: 'DELETE' })
    if (res.ok) {
      setAdmins(prev => prev.filter(a => a !== email))
    } else {
      const body = await res.json()
      setError(body.error ?? 'Failed to remove admin')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className={`relative w-full max-w-sm rounded-2xl border shadow-2xl ${D.modal}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${D.header}`}>
          <h2 className={`font-semibold text-base ${D.title}`}>Manage Admins</h2>
          <button onClick={onClose} className={`text-xl leading-none ${D.close}`}>✕</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Admin list */}
          <div>
            <p className={`text-xs mb-2 ${D.label}`}>Current admins</p>
            {loading ? (
              <p className={`text-sm ${D.label}`}>Loading…</p>
            ) : (
              <ul className="space-y-1">
                {admins.map(email => (
                  <li key={email} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${D.row}`}>
                    <span className={`text-sm truncate flex-1 mr-2 ${D.email}`}>{email}</span>
                    {email !== currentUserEmail.toLowerCase() && (
                      <button
                        onClick={() => handleRemove(email)}
                        disabled={saving}
                        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                        title="Remove admin"
                      >
                        <TrashIcon size={13} color={isDark ? '#F87171' : '#EF4444'} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add form */}
          <div>
            <p className={`text-xs mb-1.5 ${D.label}`}>Add admin</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="email@example.com"
                className={`flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none ${D.input}`}
                disabled={saving}
              />
              <button
                onClick={handleAdd}
                disabled={saving || !newEmail.trim()}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)', color: isDark ? '#F59E0B' : '#D97706' }}
              >
                Add
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}

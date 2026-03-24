'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SITE_TITLE_ZH, SITE_TITLE_EN } from '@/lib/constants'
import type { User } from '@supabase/supabase-js'
import { SearchIcon, SunIcon, MoonIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, UsersIcon } from './Icons'
import { AdminModal } from './AdminModal'

interface Props {
  user: User | null
  canEdit: boolean
  isDark: boolean
  mounted: boolean
  onToggleTheme: () => void
  query: string
  onQueryChange: (q: string) => void
  matchCount: number
  matchIndex: number
  onPrev: () => void
  onNext: () => void
}

export function Header({ user, canEdit, isDark, mounted, onToggleTheme, query, onQueryChange, matchCount, matchIndex, onPrev, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const supabase = createClient()

  const text   = isDark ? '#F9FAFB' : '#0F172A'
  const muted  = isDark ? '#6B7280' : '#94A3B8'
  const accent = isDark ? '#F59E0B' : '#D97706'

  async function signIn() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/api/auth/callback` },
    })
  }

  async function signOut() {
    setLoading(true)
    await supabase.auth.signOut()
    location.reload()
  }

  const searchBar = (
    <div className="flex items-center gap-1 flex-1">
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center"><SearchIcon color={muted} /></span>
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="搜尋 Search…"
          className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs font-chinese outline-none"
          style={{
            background: isDark ? '#1F2937' : '#F1F5F9',
            border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
            color: text,
          }}
        />
      </div>
      {matchCount > 0 && (
        <>
          <span className="text-xs shrink-0" style={{ color: muted }}>{matchIndex + 1}/{matchCount}</span>
          <button onClick={onPrev} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: accent }}><ChevronLeftIcon color={accent} /></button>
          <button onClick={onNext} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: accent }}><ChevronRightIcon color={accent} /></button>
        </>
      )}
      {query.trim() && matchCount === 0 && (
        <span className="text-xs shrink-0" style={{ color: muted }}>無結果</span>
      )}
    </div>
  )

  return (
    <header className="site-header shrink-0">
      {/* Top row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Mark + Title */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
            title="v1.0.1"
          >
            <span className="font-chinese font-semibold text-sm leading-none" style={{ color: accent }}>谢</span>
          </div>
          <div>
            <h1 className="font-chinese font-semibold text-base leading-tight tracking-wide" style={{ color: text }}>
              {SITE_TITLE_ZH}
            </h1>
            <p className="text-xs tracking-widest" style={{ color: muted }}>{SITE_TITLE_EN}</p>
          </div>
        </div>

        {/* Search — inline on md+, only after theme is known */}
        {mounted && (
          <div className="hidden md:flex flex-1 max-w-xs mx-4">
            {searchBar}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
        {canEdit && (
          <>
            <span
              className="text-xs font-chinese rounded-md px-2 py-1 hidden sm:inline"
              style={{ color: accent, background: `${accent}10`, border: `1px solid ${accent}25` }}
            >
              <PencilIcon color={accent} /> 編輯模式
            </span>
            <button
              onClick={() => setShowAdminModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{
                background: `${accent}18`,
                border: `1px solid ${accent}50`,
              }}
              title="Manage admins"
            >
              <UsersIcon color={accent} />
            </button>
          </>
        )}

        {/* Theme toggle — only after theme is known to avoid flicker */}
        {mounted && (
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{
              background: isDark ? '#1F2937' : '#F1F5F9',
              border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              color: isDark ? '#9CA3AF' : '#64748B',
            }}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <SunIcon color={isDark ? '#9CA3AF' : '#64748B'} /> : <MoonIcon color={isDark ? '#9CA3AF' : '#64748B'} />}
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:block" style={{ color: muted }}>
              {user.email}
            </span>
            <button onClick={signOut} disabled={loading} className="btn-ghost text-sm">
              登出
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            disabled={loading}
            className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(217, 119, 6, 0.094)',
              border: '1px solid rgba(217, 119, 6, 0.19)',
              color: accent,
            }}
          >
            <GoogleIcon />
            <span>Admin</span>
          </button>
        )}
        </div>
      </div>

      {/* Search — separate row on mobile, only after theme is known */}
      {mounted && (
        <div className="md:hidden px-4 pb-2.5">
          {searchBar}
        </div>
      )}

      {showAdminModal && user && (
        <AdminModal
          isDark={isDark}
          currentUserEmail={user.email ?? ''}
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </header>
  )
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

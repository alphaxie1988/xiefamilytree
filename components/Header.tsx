'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SITE_TITLE_ZH, SITE_TITLE_EN } from '@/lib/constants'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User | null
  canEdit: boolean
}

export function Header({ user, canEdit }: Props) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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

  return (
    <header className="site-header flex items-center justify-between px-6 py-3 shrink-0">
      {/* Left: Seal + Title */}
      <div className="flex items-center gap-4">
        {/* Traditional seal */}
        <div className="relative">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <rect x="1" y="1" width="42" height="42" rx="4"
              fill="#8B1A1A" stroke="#C9A84C" strokeWidth="1.5"/>
            <rect x="4" y="4" width="36" height="36" rx="2"
              fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8"/>
            <text x="22" y="19" textAnchor="middle" fontSize="11"
              fill="#F5E6C8" fontFamily="Noto Serif SC,serif" fontWeight="600">許氏</text>
            <text x="22" y="34" textAnchor="middle" fontSize="10"
              fill="#F5E6C8" fontFamily="Noto Serif SC,serif">族譜</text>
          </svg>
        </div>

        <div>
          <h1 className="text-gold font-chinese font-semibold text-xl leading-tight tracking-wider">
            {SITE_TITLE_ZH}
          </h1>
          <p className="text-gold/50 text-xs tracking-widest">{SITE_TITLE_EN}</p>
        </div>
      </div>

      {/* Right: status + auth */}
      <div className="flex items-center gap-3">
        {canEdit && (
          <span className="text-xs text-gold/70 font-chinese border border-gold/30 rounded px-2 py-1">
            ✎ 編輯模式 Edit Mode
          </span>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-gold/60 text-sm font-chinese hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={signOut}
              disabled={loading}
              className="btn-ghost text-sm"
            >
              登出 Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            disabled={loading}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <GoogleIcon />
            <span className="font-chinese">登入 Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Header } from './Header'
import { FamilyTreeCanvas } from './FamilyTreeCanvas'
import type { FamilyMember } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface Props {
  members: FamilyMember[]
  canEdit: boolean
  user: User | null
}

export function TreeApp({ members, canEdit, user }: Props) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true) // default until mounted

  useEffect(() => {
    setIsDark(!document.documentElement.classList.contains('theme-light'))
    setMounted(true)
  }, [])

  function toggleTheme() {
    setIsDark(prev => {
      const next = !prev
      const add    = next ? 'theme-dark'  : 'theme-light'
      const remove = next ? 'theme-light' : 'theme-dark'
      document.documentElement.classList.add(add)
      document.documentElement.classList.remove(remove)
      try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
      return next
    })
  }

  return (
    <div className={`flex flex-col h-screen ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Header user={user} canEdit={canEdit} isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="flex-1 relative overflow-hidden">
        {mounted && <FamilyTreeCanvas members={members} canEdit={canEdit} isDark={isDark} />}
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from './Header'
import { FamilyTreeCanvas } from './FamilyTreeCanvas'
import type { FamilyMember } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import { matchesSearch } from '@/lib/search'

interface Props {
  members: FamilyMember[]
  canEdit: boolean
  user: User | null
}

export function TreeApp({ members, canEdit, user }: Props) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

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

  const [query, setQuery] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)

  const matchIds = useMemo(() => {
    if (!query.trim()) return []
    return members
      .filter(m =>
        matchesSearch(m.line1, query) ||
        matchesSearch(m.line2, query) ||
        matchesSearch(m.line3, query)
      )
      .map(m => m.id)
  }, [members, query])

  // Reset to first match whenever query changes
  useEffect(() => { setMatchIndex(0) }, [query])

  const focusNodeId = matchIds.length > 0 ? matchIds[matchIndex] : null

  function handlePrev() {
    setMatchIndex(i => (i - 1 + matchIds.length) % matchIds.length)
  }
  function handleNext() {
    setMatchIndex(i => (i + 1) % matchIds.length)
  }

  return (
    <div className={`flex flex-col h-screen ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Header
        user={user}
        canEdit={canEdit}
        isDark={isDark}
        mounted={mounted}
        onToggleTheme={toggleTheme}
        query={query}
        onQueryChange={setQuery}
        matchCount={matchIds.length}
        matchIndex={matchIndex}
        onPrev={handlePrev}
        onNext={handleNext}
      />
      <main className="flex-1 relative overflow-hidden">
        {mounted && (
          <FamilyTreeCanvas
            members={members}
            canEdit={canEdit}
            isDark={isDark}
            focusNodeId={focusNodeId}
          />
        )}
      </main>
    </div>
  )
}

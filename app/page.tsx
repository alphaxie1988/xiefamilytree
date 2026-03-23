import { createClient } from '@/lib/supabase/server'
import { isAuthorizedEditor } from '@/lib/auth'
import type { FamilyMember } from '@/lib/types'
import { Header } from '@/components/Header'
import { FamilyTreeCanvas } from '@/components/FamilyTreeCanvas'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const canEdit = isAuthorizedEditor(user?.email)

  const { data: members, error } = await supabase
    .from('family_members')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center parchment-bg">
        <p className="text-red-trad font-chinese text-lg">載入失敗 / Failed to load tree</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Header user={user} canEdit={canEdit} />
      <main className="flex-1 relative overflow-hidden">
        <FamilyTreeCanvas
          members={(members as FamilyMember[]) ?? []}
          canEdit={canEdit}
        />
      </main>
    </div>
  )
}

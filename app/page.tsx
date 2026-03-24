import { createClient } from '@/lib/supabase/server'
import { isAuthorizedEditor } from '@/lib/auth'
import type { FamilyMember } from '@/lib/types'
import { TreeApp } from '@/components/TreeApp'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const canEdit = await isAuthorizedEditor(user?.email, supabase)

  const { data: members, error } = await supabase
    .from('family_members')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <p className="text-red-400 font-chinese text-lg">載入失敗 / Failed to load tree</p>
      </div>
    )
  }

  return (
    <TreeApp
      members={(members as FamilyMember[]) ?? []}
      canEdit={canEdit}
      user={user}
    />
  )
}

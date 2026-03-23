import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedEditor } from '@/lib/auth'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAuthorizedEditor(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()

  // Get max id
  const { data: maxRow } = await supabase
    .from('family_members')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .single()

  const newId = (maxRow?.id ?? 0) + 1

  const { data, error } = await supabase
    .from('family_members')
    .insert({ ...body, id: newId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedEditor } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !await isAuthorizedEditor(user.email, supabase)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('family_members')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !await isAuthorizedEditor(user.email, supabase)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const numId = parseInt(id)

  // Remove this ID from any parent's refs
  const { data: parents } = await supabase
    .from('family_members')
    .select('id, refs')
    .contains('refs', [numId])

  if (parents?.length) {
    for (const parent of parents) {
      const updatedRefs = (parent.refs as number[]).filter((r: number) => r !== numId)
      await supabase
        .from('family_members')
        .update({ refs: updatedRefs.length ? updatedRefs : null })
        .eq('id', parent.id)
    }
  }

  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', numId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

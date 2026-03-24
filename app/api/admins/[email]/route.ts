import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedEditor } from '@/lib/auth'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !await isAuthorizedEditor(user.email, supabase)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email } = await params
  const target = decodeURIComponent(email).toLowerCase()

  // Prevent removing yourself
  if (target === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  const { error } = await supabase.from('admins').delete().eq('email', target)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

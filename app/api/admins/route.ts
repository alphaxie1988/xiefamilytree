import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedEditor } from '@/lib/auth'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !await isAuthorizedEditor(user.email, supabase)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data, error } = await supabase.from('admins').select('email').order('email')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !await isAuthorizedEditor(user.email, supabase)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('admins')
    .insert({ email: email.toLowerCase().trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

import type { SupabaseClient } from '@supabase/supabase-js'

export async function isAuthorizedEditor(
  email: string | undefined | null,
  supabase: SupabaseClient
): Promise<boolean> {
  if (!email) return false
  const { data } = await supabase
    .from('admins')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  return data !== null
}

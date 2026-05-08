import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const base = new URL(request.url).origin

  if (!user) {
    return NextResponse.redirect(`${base}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return NextResponse.redirect(`${base}${profile?.is_admin ? '/admin' : '/dashboard'}`)
}

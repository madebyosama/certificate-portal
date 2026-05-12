import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // 1. Verify the caller is a logged-in admin using the regular cookie-based client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Validate input
  let body: { email?: string; full_name?: string; atp_name?: string; atp_no?: string; atp_address?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const full_name = (body.full_name ?? '').trim() || null
  const atp_name = (body.atp_name ?? '').trim() || null
  const atp_no = (body.atp_no ?? '').trim() || null
  const atp_address = (body.atp_address ?? '').trim() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  // 3. Send invite via admin API
  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin client unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { origin } = new URL(request.url)
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
    data: { full_name, atp_name },
  })

  if (inviteError || !inviteData?.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? 'Failed to send invitation' },
      { status: 400 }
    )
  }

  const newUserId = inviteData.user.id

  // 4. Create or update the profile row for the invited user.
  //    Some Supabase projects have a trigger that creates this automatically;
  //    upsert works whether or not such a trigger exists.
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: newUserId,
      email,
      full_name,
      atp_name,
      atp_no,
      atp_address,
      is_admin: false,
    }, { onConflict: 'id' })

  if (profileError) {
    // The auth user was created but profile insert failed — surface the error.
    // Admin can re-run or fix manually; we don't roll back the invite because
    // the email may already have been delivered.
    return NextResponse.json(
      { error: `Invite sent, but profile setup failed: ${profileError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    user: {
      id: newUserId,
      email,
      full_name,
      atp_name,
      atp_no,
      atp_address,
    },
  })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Build today's ATP number prefix in the form `ATP-YYYYMMDD`.
 * The full ATP number appends a per-day counter, e.g. `ATP-202605131`.
 */
function todaysAtpPrefix(now = new Date()): string {
  const yyyy = now.getUTCFullYear().toString()
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0')
  const dd = now.getUTCDate().toString().padStart(2, '0')
  return `ATP-${yyyy}${mm}${dd}-` // ← added trailing dash
}

/**
 * Given an array of existing ATP numbers for today, return the next counter.
 * Counter starts at 1 and increments by 1 for each ATP added on the same day.
 */
function nextCounter(existing: string[], prefix: string): number {
  let max = 0
  for (const value of existing) {
    if (!value || !value.startsWith(prefix)) continue
    const tail = value.slice(prefix.length)
    const n = parseInt(tail, 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max + 1
}

export async function POST(request: Request) {
  // 1. Verify the caller is a logged-in admin using the regular cookie-based client
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Validate input
  let body: {
    email?: string
    full_name?: string
    atp_name?: string
    atp_address?: string
    phone?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const full_name = (body.full_name ?? '').trim() || null
  const atp_name = (body.atp_name ?? '').trim() || null
  const atp_address = (body.atp_address ?? '').trim() || null
  const phone = (body.phone ?? '').trim() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'A valid email is required' },
      { status: 400 }
    )
  }

  // 3. Admin client
  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Admin client unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // 4. Auto-generate the ATP number based on today's date + per-day counter.
  //    Format: ATP-YYYYMMDDN where N is the 1-based counter of ATPs created
  //    on this date. We look at existing rows whose atp_no starts with today's
  //    prefix and increment the highest counter seen.
  const prefix = todaysAtpPrefix()
  const { data: todayRows, error: todayErr } = await admin
    .from('profiles')
    .select('atp_no')
    .like('atp_no', `${prefix}%`)

  if (todayErr) {
    return NextResponse.json(
      { error: `Failed to compute ATP number: ${todayErr.message}` },
      { status: 500 }
    )
  }

  const counter = nextCounter(
    (todayRows ?? []).map((r) => (r.atp_no ?? '') as string),
    prefix
  )
  const atp_no = `${prefix}${counter}`

  // 5. Generate an invite link via the admin API. `generateLink` returns the
  //    action link in the response so we can show it to the admin (in addition
  //    to Supabase emailing it). The link drops the user on /auth/callback
  //    which then redirects to /reset-password where they set their password.
  const { origin } = new URL(request.url)
  const redirectTo = `${origin}/auth/callback?next=/reset-password`

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo,
        data: { full_name, atp_name },
      },
    })

  if (linkError || !linkData?.user) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Failed to generate invite link' },
      { status: 400 }
    )
  }

  const newUserId = linkData.user.id
  const actionLink = linkData.properties?.action_link ?? null

  // 6. Create or update the profile row for the invited user.
  //    Some Supabase projects have a trigger that creates this automatically;
  //    upsert works whether or not such a trigger exists.
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: newUserId,
      email,
      full_name,
      atp_name,
      atp_no,
      atp_address,
      phone,
      is_admin: false,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return NextResponse.json(
      {
        error: `Invite generated, but profile setup failed: ${profileError.message}`,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    action_link: actionLink,
    user: {
      id: newUserId,
      email,
      full_name,
      atp_name,
      atp_no,
      atp_address,
      phone,
    },
  })
}

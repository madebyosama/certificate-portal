import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // 1. Verify the caller is a logged-in admin via the cookie-based client
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

  // 2. Parse input
  let body: { deposit_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const depositId = (body.deposit_id ?? '').trim()
  if (!depositId) {
    return NextResponse.json({ error: 'deposit_id is required' }, { status: 400 })
  }

  // 3. Call the atomic RPC using the service-role client so RLS cannot
  //    silently block part of the approval (deposit update, profile
  //    credit, transaction insert all happen in one DB transaction).
  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin client unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data, error } = await admin.rpc('approve_deposit', { p_deposit_id: depositId })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Postgres function returns a single row (deposit_id, atp_id, new_balance)
  const row = Array.isArray(data) ? data[0] : data
  return NextResponse.json({
    success: true,
    deposit_id: row?.deposit_id ?? depositId,
    atp_id: row?.atp_id ?? null,
    new_balance: row?.new_balance ?? null,
  })
}

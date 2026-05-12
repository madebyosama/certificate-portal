import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // 1. Verify the caller is a logged-in admin
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

  // 3. Mark rejected using the service-role client. Reject does not
  //    touch the balance or the ledger so a simple update is enough —
  //    but we still go through the service role for parity with approve
  //    and so it works even if admin RLS policies aren't in place.
  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin client unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Guard: don't allow rejecting a deposit that's already been approved
  // (that would imply funds were already credited).
  const { data: existing, error: readErr } = await admin
    .from('deposits').select('status').eq('id', depositId).single()
  if (readErr || !existing) {
    return NextResponse.json({ error: readErr?.message ?? 'Deposit not found' }, { status: 404 })
  }
  if (existing.status === 'approved') {
    return NextResponse.json(
      { error: 'Deposit is already approved and cannot be rejected' },
      { status: 400 }
    )
  }

  const { error: updateErr } = await admin
    .from('deposits').update({ status: 'rejected' }).eq('id', depositId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, deposit_id: depositId })
}

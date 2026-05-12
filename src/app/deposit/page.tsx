import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import DepositClient from './DepositClient'

export default async function DepositPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: deposits } = await supabase.from('deposits').select('*').eq('atp_id', user.id).order('created_at', { ascending: false })

  const displayName = profile?.atp_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Wallet</h1>
      </div>
      <DepositClient deposits={deposits ?? []} userId={user.id} balance={profile?.deposit_balance ?? 0} />
    </AppLayout>
  )
}

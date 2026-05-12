import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import DepositsClient from './DepositsClient'

export default async function AdminDepositsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: deposits } = await supabase
    .from('deposits')
    .select('*, profile:profiles(atp_name, full_name, email, deposit_balance)')
    .order('created_at', { ascending: false })

  return (
    <AdminLayout userName={profile?.full_name || user.email || 'Admin'}>
      <div className="page-header"><h1 className="page-title">Deposit Verification</h1></div>
      <DepositsClient deposits={deposits ?? []} />
    </AdminLayout>
  )
}

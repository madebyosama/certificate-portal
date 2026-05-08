import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import SupportClient from './SupportClient'

export default async function AdminSupportPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, profile:profiles(atc_name, full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <AdminLayout userName={profile?.full_name || user.email || 'Admin'}>
      <div className="page-header"><h1 className="page-title">Support Inbox</h1></div>
      <SupportClient tickets={tickets ?? []} />
    </AdminLayout>
  )
}

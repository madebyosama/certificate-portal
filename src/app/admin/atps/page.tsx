import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AtpsClient from './AtpsClient'

export default async function AdminAtpsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: atps } = await supabase
    .from('profiles').select('*').eq('is_admin', false)
    .order('created_at', { ascending: false })

  return (
    <AdminLayout userName={profile?.full_name || user.email || 'Admin'}>
      <div className="page-header"><h1 className="page-title">ATP Management</h1></div>
      <AtpsClient atps={atps ?? []} />
    </AdminLayout>
  )
}

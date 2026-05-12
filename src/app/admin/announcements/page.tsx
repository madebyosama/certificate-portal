import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AnnouncementsClient from './AnnouncementsClient'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [{ data: announcements }, { data: atps }] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, atp_name, full_name, email').eq('is_admin', false).order('atp_name'),
  ])

  return (
    <AdminLayout userName={profile?.full_name || user.email || 'Admin'}>
      <div className="page-header"><h1 className="page-title">Announcements</h1></div>
      <AnnouncementsClient announcements={announcements ?? []} atps={atps ?? []} adminId={user.id} />
    </AdminLayout>
  )
}

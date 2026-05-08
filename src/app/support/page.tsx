import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import SupportForm from './SupportForm'

export default async function SupportPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('atc_id', user.id)
    .order('created_at', { ascending: false })

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header"><h1 className="page-title">Support</h1></div>
      <SupportForm userId={user.id} tickets={tickets ?? []} />
    </AppLayout>
  )
}

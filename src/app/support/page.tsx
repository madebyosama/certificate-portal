import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import SupportForm from './SupportForm'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, messages:support_messages(*)')
    .eq('atp_id', user.id)
    .order('created_at', { ascending: false })

  // Sort messages within each ticket chronologically
  const ticketsWithSortedMessages = (tickets ?? []).map(t => ({
    ...t,
    messages: (t.messages ?? []).sort((a: any, b: any) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))

  const displayName = profile?.atp_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header"><h1 className="page-title">Support</h1></div>
      <SupportForm userId={user.id} tickets={ticketsWithSortedMessages} />
    </AppLayout>
  )
}

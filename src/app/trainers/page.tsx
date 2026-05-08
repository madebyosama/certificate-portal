import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import TrainersClient from './TrainersClient'

export default async function TrainersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: trainers } = await supabase.from('trainers').select('*').eq('atc_id', user.id).order('created_at', { ascending: false })

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Trainers</h1>
      </div>
      <TrainersClient trainers={trainers ?? []} userId={user.id} />
    </AppLayout>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import AddCandidatesForm from './AddCandidatesForm'

export default async function AddCandidatesPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .eq('atc_id', user.id)
    .single()

  if (!course) notFound()

  const { data: candidates } = await supabase
    .from('candidates')
    .select('*')
    .eq('course_id', params.id)
    .order('created_at')

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: '1.15rem' }}>
          {course.course_title} / (Ref No # {course.reference_number})
        </h1>
      </div>
      <AddCandidatesForm
        courseId={params.id}
        userId={user.id}
        initialCandidates={candidates ?? []}
      />
    </AppLayout>
  )
}

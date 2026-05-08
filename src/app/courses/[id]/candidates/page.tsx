import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import AddCandidatesForm from './AddCandidatesForm'

export default async function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: course } = await supabase.from('courses').select('*, course_type:course_types(title,price)').eq('id', id).eq('atc_id', user.id).single()
  if (!course) notFound()

  const { data: candidates } = await supabase.from('candidates').select('*').eq('course_id', id).order('created_at')

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Students</h1>
          <div style={{ fontSize: '0.825rem', color: '#6b7280', marginTop: 2 }}>
            {course.course_title} {course.reference_number ? `· Ref ${course.reference_number}` : ''}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.825rem', color: '#6b7280' }}>
          <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>1</span>
          Course Details
          <span>→</span>
          <span style={{ background: '#1976d2', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>2</span>
          <strong style={{ color: '#111827' }}>Add Students</strong>
          <span>→</span>
          <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>3</span>
          Pay & Activate
        </div>
      </div>

      {course.course_type && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <strong>{course.course_type.title}</strong> — ${course.course_type.price.toFixed(2)} per student.
          {(candidates?.length ?? 0) > 0 && (
            <> Current total: <strong>${(course.course_type.price * (candidates?.length ?? 0)).toFixed(2)}</strong> for {candidates?.length} student{candidates?.length !== 1 ? 's' : ''}</>
          )}
        </div>
      )}

      <AddCandidatesForm courseId={id} userId={user.id} initialCandidates={candidates ?? []} />
    </AppLayout>
  )
}

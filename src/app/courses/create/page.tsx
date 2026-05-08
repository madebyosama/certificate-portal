import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import CreateCourseForm from './CreateCourseForm'

export default async function CreateCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: courseTypes } = await supabase.from('course_types').select('*').eq('is_active', true).order('title')
  const { data: trainers } = await supabase.from('trainers').select('*').eq('atc_id', user.id).eq('is_active', true)

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Register Course</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.825rem', color: '#6b7280' }}>
          <span style={{ background: '#1976d2', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>1</span>
          <strong style={{ color: '#111827' }}>Course Details</strong>
          <span>→</span>
          <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>2</span>
          Add Students
          <span>→</span>
          <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>3</span>
          Pay & Activate
        </div>
      </div>

      <div className="card">
        <div className="card-header">Step 1 — Course Details</div>
        <div className="card-body">
          <CreateCourseForm
            courseTypes={courseTypes ?? []}
            trainers={trainers ?? []}
            userId={user.id}
          />
        </div>
      </div>
    </AppLayout>
  )
}

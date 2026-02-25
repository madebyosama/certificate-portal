import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import CreateCourseForm from './CreateCourseForm'

export default async function CreateCoursePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: courseTypes } = await supabase.from('course_types').select('*').eq('is_active', true).order('title')
  const { data: trainers } = await supabase.from('trainers').select('*').eq('atc_id', user.id).eq('is_active', true)

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Create Course</h1>
      </div>
      <div className="card">
        <div className="card-header">Add Course</div>
        <div className="card-body">
          <CreateCourseForm
            courseTypes={courseTypes ?? []}
            trainers={trainers ?? []}
            profile={profile}
            userId={user.id}
          />
        </div>
      </div>
    </AppLayout>
  )
}

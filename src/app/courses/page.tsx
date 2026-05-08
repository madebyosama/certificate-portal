import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import CoursesTable from './CoursesTable'
import { getCachedProfile, getCachedCourses } from '@/lib/data'

export default async function CoursesPage({ searchParams }: { searchParams: { filter?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, allCourses] = await Promise.all([
    getCachedProfile(user.id),
    getCachedCourses(user.id),
  ])

  const courses = searchParams.filter
    ? allCourses.filter((c: any) => c.status === searchParams.filter)
    : allCourses

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        <Link href="/courses/create" className="btn btn-primary">+ Register Course</Link>
      </div>
      <div className="card">
        <div className="card-header">
          {searchParams.filter ? `Courses — ${searchParams.filter}` : 'All Courses'}
        </div>
        <CoursesTable courses={courses ?? []} />
      </div>
    </AppLayout>
  )
}

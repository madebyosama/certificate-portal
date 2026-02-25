import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import type { Candidate } from '@/lib/types'

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: course } = await supabase
    .from('courses')
    .select(
      `*, trainer:trainers(first_name, last_name), course_type:course_types(title, price)`
    )
    .eq('id', params.id)
    .eq('atc_id', user.id)
    .single()

  if (!course) notFound()

  const { data: candidates } = await supabase
    .from('candidates')
    .select('*')
    .eq('course_id', params.id)
    .order('created_at')

  const displayName =
    profile?.atc_name || profile?.full_name || user.email || 'User'
  const trainerName = course.trainer
    ? `${course.trainer.first_name} ${course.trainer.last_name}`
    : '—'

  function statusBadge(status: string) {
    return <span className={`badge badge-${status}`}>{status}</span>
  }

  return (
    <AppLayout userName={displayName}>
      <div className='page-header'>
        <h1 className='page-title' style={{ fontSize: '1.15rem' }}>
          {course.course_title} / (Ref No # {course.reference_number})
        </h1>
      </div>

      <div className='card' style={{ marginBottom: 20 }}>
        <div className='card-header'>Course Details</div>
        <div className='card-body'>
          <h2 className='section-title' style={{ marginTop: 0 }}>
            Course Information
          </h2>

          <div className='detail-grid'>
            <div className='detail-label'>Course Reference Number</div>
            <div className='detail-value'>{course.reference_number}</div>
            <div className='detail-label'>Course Title</div>
            <div className='detail-value'>{course.course_title}</div>

            <div className='detail-label'>ATP Name</div>
            <div className='detail-value'>{profile?.atc_name ?? '—'}</div>
            <div className='detail-label'>ATP No</div>
            <div className='detail-value'>{profile?.atc_no ?? '—'}</div>

            <div className='detail-label'>ATP Address</div>
            <div className='detail-value'>{profile?.atc_address ?? '—'}</div>
            <div className='detail-label'>Submitted Date</div>
            <div className='detail-value'>
              {new Date(course.created_at).toLocaleString()}
            </div>

            <div className='detail-label'>Start Date</div>
            <div className='detail-value'>
              {course.start_date
                ? new Date(course.start_date).toLocaleString()
                : '—'}
            </div>
            <div className='detail-label'>End Date</div>
            <div className='detail-value'>
              {course.end_date
                ? new Date(course.end_date).toLocaleString()
                : '—'}
            </div>

            <div className='detail-label'>Total Candidates</div>
            <div
              className='detail-value'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {candidates?.length ?? 0}
              <button className='btn btn-teal btn-sm'>Generate Summary</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Link
              href={`/courses/${params.id}/candidates`}
              className='btn btn-primary btn-sm'
            >
              + Add Candidates
            </Link>
            <Link
              href={`/courses/${params.id}/purchase`}
              className='btn btn-success btn-sm'
            >
              Purchase
            </Link>
          </div>
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>Candidate Results</div>
        <div style={{ overflowX: 'auto' }}>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Name</th>
                <th>Assessment Marks-1</th>
                <th>Assessment Marks-2</th>
                <th>Marks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!candidates || candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className='empty-state'>
                    No candidates added yet.
                  </td>
                </tr>
              ) : (
                candidates.map((c: Candidate) => (
                  <tr key={c.id}>
                    <td>{c.serial_no}</td>
                    <td>
                      {c.first_name} {c.last_name}
                    </td>
                    <td>{c.assessment_marks_1 ?? '—'}</td>
                    <td>{c.assessment_marks_2 ?? '—'}</td>
                    <td>{c.total_marks}</td>
                    <td>{statusBadge(c.status)}</td>
                    <td>
                      <div className='icon-btn-row'>
                        <button
                          className='icon-btn icon-btn-blue'
                          title='Print'
                        >
                          🖨
                        </button>
                        <button
                          className='icon-btn icon-btn-orange'
                          title='Certificate'
                        >
                          📜
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

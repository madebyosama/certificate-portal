import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import type { Candidate } from '@/lib/types'

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: course } = await supabase
    .from('courses')
    .select('*, trainer:trainers(first_name,last_name), course_type:course_types(title,price)')
    .eq('id', params.id).eq('atc_id', user.id).single()
  if (!course) notFound()

  const { data: candidates } = await supabase.from('candidates').select('*').eq('course_id', params.id).order('created_at')
  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString() : '—'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{course.course_title}</h1>
          {course.reference_number && (
            <div style={{ fontSize: '0.825rem', color: '#6b7280', marginTop: 2 }}>Ref # {course.reference_number}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/courses/${params.id}/candidates`} className="btn btn-primary btn-sm">+ Add Students</Link>
          {course.status !== 'approved' && (
            <Link href={`/courses/${params.id}/purchase`} className="btn btn-success btn-sm">Pay & Activate</Link>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div className="card">
          <div className="card-header">Course Info</div>
          <div className="detail-grid">
            <div className="detail-label">Status</div>
            <div className="detail-value"><span className={`badge badge-${course.status}`}>{course.status}</span></div>
            <div className="detail-label">Course Type</div>
            <div className="detail-value">{course.course_type?.title ?? '—'}</div>
            <div className="detail-label">Trainer</div>
            <div className="detail-value">
              {course.trainer ? `${course.trainer.first_name} ${course.trainer.last_name}` : '—'}
            </div>
            <div className="detail-label">Start Date</div>
            <div className="detail-value">{fmt(course.start_date)}</div>
            <div className="detail-label">End Date</div>
            <div className="detail-value">{fmt(course.end_date)}</div>
            <div className="detail-label">Created</div>
            <div className="detail-value">{fmt(course.created_at)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">ATP Info</div>
          <div className="detail-grid">
            <div className="detail-label">ATC Name</div>
            <div className="detail-value">{profile?.atc_name ?? '—'}</div>
            <div className="detail-label">ATC No</div>
            <div className="detail-value">{profile?.atc_no ?? '—'}</div>
            <div className="detail-label">Address</div>
            <div className="detail-value">{profile?.atc_address ?? '—'}</div>
            <div className="detail-label">Students</div>
            <div className="detail-value">{candidates?.length ?? 0}</div>
            {course.course_type?.price && (
              <>
                <div className="detail-label">Total Cost</div>
                <div className="detail-value" style={{ fontWeight: 700, color: '#1976d2' }}>
                  ${(course.course_type.price * (candidates?.length ?? 0)).toFixed(2)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Students ({candidates?.length ?? 0})</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Email</th><th>Country</th>
                <th>Marks 1</th><th>Marks 2</th><th>Total</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!candidates || candidates.length === 0 ? (
                <tr><td colSpan={9} className="empty-state">No students yet. <Link href={`/courses/${params.id}/candidates`} style={{ color: '#1976d2' }}>Add students</Link></td></tr>
              ) : candidates.map((c: Candidate, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td>{c.first_name} {c.last_name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.country || '—'}</td>
                  <td>{c.assessment_marks_1 ?? '—'}</td>
                  <td>{c.assessment_marks_2 ?? '—'}</td>
                  <td>{c.total_marks}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td>
                    <div className="icon-btn-row">
                      <button className="icon-btn icon-btn-orange" title="Certificate">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

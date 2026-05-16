import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import StudentsTable from './StudentsTable'
import type { Candidate } from '@/lib/types'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
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
      '*, trainer:trainers(first_name,last_name), course_type:course_types(title,price)'
    )
    .eq('id', id)
    .eq('atp_id', user.id)
    .single()
  if (!course) notFound()

  const { data: candidates } = await supabase
    .from('candidates')
    .select('*')
    .eq('course_id', id)
    .order('created_at')

  // Pull app settings for hard-copy ordering
  const { data: settingsRows } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', [
      'certificate_hardcopy_price',
      'certificate_delivery_price',
      'certificate_tax_rate',
    ])

  const settingsMap = new Map<string, number>(
    (settingsRows ?? []).map((r: any) => [r.key, Number(r.value)])
  )
  const settings = {
    hardcopyPrice: settingsMap.get('certificate_hardcopy_price') ?? 15,
    deliveryPrice: settingsMap.get('certificate_delivery_price') ?? 8,
    taxRate: settingsMap.get('certificate_tax_rate') ?? 0.05,
  }

  const displayName =
    profile?.atp_name || profile?.full_name || user.email || 'User'

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '—')

  const totalStudents = candidates?.length ?? 0
  const paidStudents = (candidates ?? []).filter((c: any) => c.paid).length
  const unpaidStudents = totalStudents - paidStudents
  // A course is "registered" (locked) once it has been paid for — i.e.
  // any student is paid, or the course has been approved. No more
  // students may be added to a registered course.
  const courseLocked =
    paidStudents > 0 || course.status === 'approved'

  return (
    <AppLayout userName={displayName}>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>{course.course_title}</h1>
          {course.reference_number && (
            <div
              style={{ fontSize: '0.825rem', color: '#6b7280', marginTop: 2 }}
            >
              Ref # {course.reference_number}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!courseLocked && (
            <Link
              href={`/courses/${id}/candidates`}
              className='btn btn-primary btn-sm'
            >
              + Add Students
            </Link>
          )}
          {unpaidStudents > 0 ? (
            <Link
              href={`/courses/${id}/purchase`}
              className='btn btn-success btn-sm'
            >
              Pay for {unpaidStudents} Student
              {unpaidStudents !== 1 ? 's' : ''}
            </Link>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div className='card'>
          <div className='card-header'>Course Info</div>
          <div className='detail-grid'>
            <div className='detail-label'>Status</div>
            <div className='detail-value'>
              <span className={`badge badge-${course.status}`}>
                {course.status}
              </span>
            </div>
            <div className='detail-label'>Type</div>
            <div className='detail-value'>
              {course.course_type?.title ?? '—'}
            </div>
            <div className='detail-label'>Trainer</div>
            <div className='detail-value'>
              {course.trainer
                ? `${course.trainer.first_name} ${course.trainer.last_name}`
                : '—'}
            </div>
            <div className='detail-label'>Start Date</div>
            <div className='detail-value'>{fmt(course.start_date)}</div>
            <div className='detail-label'>End Date</div>
            <div className='detail-value'>{fmt(course.end_date)}</div>
            <div className='detail-label'>Created</div>
            <div className='detail-value'>{fmt(course.created_at)}</div>
          </div>
        </div>

        <div className='card'>
          <div className='card-header'>ATP Info</div>
          <div className='detail-grid'>
            <div className='detail-label'>ATP Name</div>
            <div className='detail-value'>{profile?.atp_name ?? '—'}</div>
            <div className='detail-label'>ATP No</div>
            <div className='detail-value'>{profile?.atp_no ?? '—'}</div>
            <div className='detail-label'>Address</div>
            <div className='detail-value'>{profile?.atp_address ?? '—'}</div>
            <div className='detail-label'>Students</div>
            <div className='detail-value'>
              {totalStudents}
              {totalStudents > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: '0.75rem',
                    color: '#6b7280',
                  }}
                >
                  ({paidStudents} paid
                  {unpaidStudents > 0 && (
                    <>
                      ,{' '}
                      <span style={{ color: '#b45309' }}>
                        {unpaidStudents} unpaid
                      </span>
                    </>
                  )}
                  )
                </span>
              )}
            </div>
            {course.course_type?.price && unpaidStudents > 0 && (
              <>
                <div className='detail-label'>Outstanding</div>
                <div
                  className='detail-value'
                  style={{ fontWeight: 700, color: '#b45309' }}
                >
                  ${(course.course_type.price * unpaidStudents).toFixed(2)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <StudentsTable
        candidates={(candidates ?? []) as Candidate[]}
        course={{
          id: course.id,
          course_title: course.course_title,
          start_date: course.start_date,
          end_date: course.end_date,
          reference_number: course.reference_number,
          trainer: course.trainer,
        }}
        profile={{
          id: profile?.id,
          atp_name: profile?.atp_name ?? null,
          atp_no: profile?.atp_no ?? null,
          atp_address: profile?.atp_address ?? null,
          deposit_balance: profile?.deposit_balance ?? 0,
        }}
        settings={settings}
        logoUrl='/login-logo.png'
      />
    </AppLayout>
  )
}

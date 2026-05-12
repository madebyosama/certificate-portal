import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import PurchaseForm from './PurchaseForm'

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: course } = await supabase
    .from('courses')
    .select('*, course_type:course_types(title,price,validity_days,purchase_fee)')
    .eq('id', id).eq('atp_id', user.id).single()
  if (!course) notFound()

  // Total student headcount (for display) and headcount of UNPAID students
  // (this is what actually drives the bill on subsequent visits).
  const [{ count: totalStudents }, { count: unpaidStudents }] = await Promise.all([
    supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('course_id', id),
    supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('course_id', id).eq('paid', false),
  ])

  const displayName = profile?.atp_name || profile?.full_name || user.email || 'User'
  const total = totalStudents ?? 0
  const unpaid = unpaidStudents ?? 0
  const coursePrice = course.course_type?.price ?? 7
  const purchaseFee = course.course_type?.purchase_fee ?? 0

  // The course's one-time purchase fee is paid the first time the course is
  // activated. After that, only per-student fees are billed for the unpaid
  // candidates that have since been added.
  const isFirstPurchase = course.status !== 'approved'
  const totalPrice =
    (isFirstPurchase ? purchaseFee : 0) + coursePrice * unpaid

  const depositBalance = profile?.deposit_balance ?? 0
  const stepLabel = isFirstPurchase ? 'Purchase Course' : 'Pay for New Students'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{stepLabel}</h1>
          <div style={{ fontSize: '0.825rem', color: '#6b7280', marginTop: 2 }}>{course.course_title}</div>
        </div>
      </div>

      {isFirstPurchase ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.825rem', color: '#6b7280' }}>
            <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>1</span>
            Course Details
            <span>→</span>
            <span style={{ background: '#1976d2', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>2</span>
            <strong style={{ color: '#111827' }}>Purchase Course</strong>
            <span>→</span>
            <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>3</span>
            Add Students &amp; Pay
          </div>
        </div>
      ) : (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          The course is already active. You only pay for the <strong>{unpaid}</strong> new
          student{unpaid !== 1 ? 's' : ''} that haven&apos;t been paid for yet — previously paid students will not be re-billed.
        </div>
      )}

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header">Order Summary &amp; Payment</div>
        <div className="card-body">
          <PurchaseForm
            courseId={id}
            userId={user.id}
            courseName={course.course_title}
            coursePrice={coursePrice}
            totalStudents={total}
            unpaidStudents={unpaid}
            validityDays={course.course_type?.validity_days ?? 1}
            purchaseFee={purchaseFee}
            isFirstPurchase={isFirstPurchase}
            totalPrice={totalPrice}
            depositBalance={depositBalance}
            hasEnoughBalance={depositBalance >= totalPrice}
          />
        </div>
      </div>
    </AppLayout>
  )
}

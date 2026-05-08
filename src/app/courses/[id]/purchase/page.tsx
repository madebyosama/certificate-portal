import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import PurchaseForm from './PurchaseForm'

export default async function PurchasePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: course } = await supabase
    .from('courses')
    .select('*, course_type:course_types(title,price,validity_days,purchase_fee)')
    .eq('id', params.id).eq('atc_id', user.id).single()
  if (!course) notFound()

  const { count: numStudents } = await supabase
    .from('candidates').select('*', { count: 'exact', head: true }).eq('course_id', params.id)

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'
  const students = numStudents ?? 0
  const coursePrice = course.course_type?.price ?? 7
  const purchaseFee = course.course_type?.purchase_fee ?? 0
  const totalPrice = coursePrice * students + purchaseFee
  const depositBalance = profile?.deposit_balance ?? 0

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment</h1>
          <div style={{ fontSize: '0.825rem', color: '#6b7280', marginTop: 2 }}>{course.course_title}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.825rem', color: '#6b7280' }}>
          <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>1</span>
          Course Details
          <span>→</span>
          <span style={{ background: '#e5e7eb', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>2</span>
          Add Students
          <span>→</span>
          <span style={{ background: '#1976d2', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>3</span>
          <strong style={{ color: '#111827' }}>Pay & Activate</strong>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header">Order Summary & Payment</div>
        <div className="card-body">
          <PurchaseForm
            courseId={params.id}
            userId={user.id}
            courseName={course.course_title}
            coursePrice={coursePrice}
            numStudents={students}
            validityDays={course.course_type?.validity_days ?? 1}
            purchaseFee={purchaseFee}
            totalPrice={totalPrice}
            depositBalance={depositBalance}
            hasEnoughBalance={depositBalance >= totalPrice}
          />
        </div>
      </div>
    </AppLayout>
  )
}

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
    .select(`*, course_type:course_types(title, price, validity_days, purchase_fee)`)
    .eq('id', params.id)
    .eq('atc_id', user.id)
    .single()

  if (!course) notFound()

  const { count: candidateCount } = await supabase
    .from('candidates')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', params.id)

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'
  const numPacks = candidateCount ?? 0
  const coursePrice = course.course_type?.price ?? 7
  const purchaseFee = course.course_type?.purchase_fee ?? 0
  const totalPrice = (coursePrice * numPacks) + purchaseFee
  const depositBalance = profile?.deposit_balance ?? 0
  const hasEnoughBalance = depositBalance >= totalPrice

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Purchase Course</h1>
      </div>
      <div className="card">
        <div className="card-header">Purchase Course</div>
        <div className="card-body">
          <PurchaseForm
            courseId={params.id}
            userId={user.id}
            courseName={course.course_title}
            coursePrice={coursePrice}
            numPacks={numPacks}
            validityDays={course.course_type?.validity_days ?? 1}
            purchaseFee={purchaseFee}
            totalPrice={totalPrice}
            depositBalance={depositBalance}
            hasEnoughBalance={hasEnoughBalance}
          />
        </div>
      </div>
    </AppLayout>
  )
}

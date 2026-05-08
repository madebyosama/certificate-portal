import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import AnalyticsClient from './AnalyticsClient'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [
    { data: courses },
    { data: invoices },
    { data: candidates },
    { data: atps },
    { data: deposits },
  ] = await Promise.all([
    supabase.from('courses').select('status, created_at, course_title').order('created_at'),
    supabase.from('invoices').select('amount, status, issued_at, payment_method').order('issued_at'),
    supabase.from('candidates').select('status, created_at, country').order('created_at'),
    supabase.from('profiles').select('created_at, kyc_verified, deposit_balance').eq('is_admin', false),
    supabase.from('deposits').select('amount, status, created_at'),
  ])

  return (
    <AdminLayout userName={profile?.full_name || user.email || 'Admin'}>
      <div className="page-header"><h1 className="page-title">Analytics</h1></div>
      <AnalyticsClient
        courses={courses ?? []}
        invoices={invoices ?? []}
        candidates={candidates ?? []}
        atps={atps ?? []}
        deposits={deposits ?? []}
      />
    </AdminLayout>
  )
}

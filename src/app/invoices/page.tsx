import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

export default async function InvoicesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`*, course:courses(course_title, reference_number)`)
    .eq('atc_id', user.id)
    .order('issued_at', { ascending: false })

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  function statusBadge(status: string) {
    const cls = status === 'paid' ? 'badge-paid' : status === 'overdue' ? 'badge-overdue' : status === 'pending' ? 'badge-pending' : 'badge-cancelled'
    return <span className={`badge ${cls}`}>{status}</span>
  }

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
      </div>
      <div className="card">
        <div className="card-header">All Invoices</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Course</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {!invoices || invoices.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No invoices found.</td></tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{inv.invoice_number}</span></td>
                    <td>{inv.course?.course_title ?? '—'}</td>
                    <td>${inv.amount.toFixed(2)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{inv.payment_method ?? '—'}</td>
                    <td>{statusBadge(inv.status)}</td>
                    <td>{new Date(inv.issued_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {invoices?.length ?? 0} entries</span>
        </div>
      </div>
    </AppLayout>
  )
}

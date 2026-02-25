import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

export default async function OtherInvoicesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: invoices } = await supabase
    .from('other_invoices')
    .select('*')
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
        <h1 className="page-title">Other Invoices</h1>
      </div>
      <div className="card">
        <div className="card-header">Other Invoices</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {!invoices || invoices.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No other invoices found.</td></tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td>{inv.description ?? '—'}</td>
                    <td>${inv.amount.toFixed(2)}</td>
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

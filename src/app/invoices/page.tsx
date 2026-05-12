import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const [{ data: invoices }, { data: otherInvoices }] = await Promise.all([
    supabase.from('invoices').select('*, course:courses(course_title,reference_number)').eq('atp_id', user.id).order('issued_at', { ascending: false }),
    supabase.from('other_invoices').select('*').eq('atp_id', user.id).order('issued_at', { ascending: false }),
  ])

  const displayName = profile?.atp_name || profile?.full_name || user.email || 'User'
  const totalPaid = (invoices ?? []).filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + i.amount, 0)

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <div style={{ fontSize: '0.825rem', color: '#6b7280' }}>
          Total paid: <strong style={{ color: '#43a047' }}>${totalPaid.toFixed(2)}</strong>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Course Invoices</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Invoice #</th><th>Course</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {!invoices || invoices.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No course invoices yet.</td></tr>
              ) : invoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td style={{ fontSize: '0.775rem', color: '#6b7280', fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.course?.course_title ?? '—'}</div>
                    {inv.course?.reference_number && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Ref {inv.course.reference_number}</div>}
                  </td>
                  <td style={{ fontWeight: 600 }}>${inv.amount.toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{inv.payment_method?.replace('_', ' ') ?? '—'}</td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                  <td>{new Date(inv.issued_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{invoices?.length ?? 0} invoice{invoices?.length !== 1 ? 's' : ''}</span></div>
      </div>

      {otherInvoices && otherInvoices.length > 0 && (
        <div className="card">
          <div className="card-header">Other Charges</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Description</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {otherInvoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td>{inv.description ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>${inv.amount.toFixed(2)}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td>{new Date(inv.issued_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>{otherInvoices.length} charge{otherInvoices.length !== 1 ? 's' : ''}</span></div>
        </div>
      )}
    </AppLayout>
  )
}

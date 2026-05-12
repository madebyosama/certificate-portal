import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'

export default async function AdminFinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [{ data: invoices }, { data: transactions }] = await Promise.all([
    supabase.from('invoices')
      .select('*, profile:profiles(atp_name, full_name), course:courses(course_title)')
      .order('issued_at', { ascending: false })
      .limit(200),
    supabase.from('transactions')
      .select('*, profile:profiles(atp_name, full_name)')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const paid = (invoices ?? []).filter((i: any) => i.status === 'paid')
  const totalRevenue = paid.reduce((s: number, i: any) => s + i.amount, 0)
  const thisMonth = paid.filter((i: any) => new Date(i.issued_at) >= new Date(new Date().setDate(1)))
  const monthRevenue = thisMonth.reduce((s: number, i: any) => s + i.amount, 0)
  const displayName = profile?.full_name || user.email || 'Admin'

  return (
    <AdminLayout userName={displayName}>
      <div className="page-header"><h1 className="page-title">Financial Overview</h1></div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#43a047' },
          { label: 'This Month', value: `$${monthRevenue.toFixed(2)}`, color: '#1976d2' },
          { label: 'Paid Invoices', value: paid.length, color: '#00acc1' },
          { label: 'Pending Invoices', value: (invoices ?? []).filter((i: any) => i.status === 'pending').length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">All Invoices</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Invoice #</th><th>ATP</th><th>Course</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {!invoices || invoices.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No invoices yet.</td></tr>
              ) : invoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                  <td>{inv.profile?.atp_name || inv.profile?.full_name || '—'}</td>
                  <td>{inv.course?.course_title || '—'}</td>
                  <td style={{ fontWeight: 600 }}>${inv.amount.toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{inv.payment_method || '—'}</td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                  <td>{new Date(inv.issued_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{invoices?.length ?? 0} invoices</span></div>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="card-header">All Transactions</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>ATP</th><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th></tr>
            </thead>
            <tbody>
              {!transactions || transactions.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No transactions yet.</td></tr>
              ) : transactions.map((t: any) => (
                <tr key={t.id}>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>{t.profile?.atp_name || t.profile?.full_name || '—'}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: t.type === 'credit' ? '#43a047' : '#e53935' }}>
                      {t.type === 'credit' ? '▲ Credit' : '▼ Debit'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: t.type === 'credit' ? '#43a047' : '#e53935' }}>
                    {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.775rem', color: '#6b7280' }}>{t.description || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.775rem' }}>${(t.balance_after ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{transactions?.length ?? 0} transactions</span></div>
      </div>
    </AdminLayout>
  )
}

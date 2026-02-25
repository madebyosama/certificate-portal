import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

export default async function TransactionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('atc_id', user.id)
    .order('created_at', { ascending: false })

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
      </div>
      <div className="card">
        <div className="card-header">Transaction History</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {!transactions || transactions.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No transactions yet.</td></tr>
              ) : (
                transactions.map((t: any) => (
                  <tr key={t.id}>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${t.type === 'credit' ? 'badge-pass' : 'badge-fail'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td>{t.description ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{t.reference ?? '—'}</td>
                    <td style={{ color: t.type === 'credit' ? 'var(--green-500)' : 'var(--red-500)', fontWeight: 600 }}>
                      {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td>${t.balance_after?.toFixed(4) ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {transactions?.length ?? 0} entries</span>
        </div>
      </div>
    </AppLayout>
  )
}

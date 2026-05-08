'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DepositsClient({ deposits: initial }: { deposits: any[] }) {
  const supabase = createClient()
  const [deposits, setDeposits] = useState<any[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  async function approve(deposit: any) {
    setLoading(deposit.id)
    // Update deposit status
    await supabase.from('deposits').update({ status: 'approved' }).eq('id', deposit.id)

    // Credit ATP balance
    const { data: prof } = await supabase.from('profiles').select('deposit_balance').eq('id', deposit.atc_id).single()
    const newBal = (prof?.deposit_balance ?? 0) + deposit.amount
    await supabase.from('profiles').update({ deposit_balance: newBal }).eq('id', deposit.atc_id)

    // Log transaction
    await supabase.from('transactions').insert({
      atc_id: deposit.atc_id, type: 'credit', amount: deposit.amount,
      description: 'Deposit approved by admin',
      reference: deposit.reference, balance_after: newBal,
    })

    setDeposits(p => p.map(d => d.id === deposit.id ? { ...d, status: 'approved' } : d))
    setLoading(null)
  }

  async function reject(deposit: any) {
    setLoading(deposit.id + '_reject')
    await supabase.from('deposits').update({ status: 'rejected' }).eq('id', deposit.id)
    setDeposits(p => p.map(d => d.id === deposit.id ? { ...d, status: 'rejected' } : d))
    setLoading(null)
  }

  const filtered = filter === 'all' ? deposits : deposits.filter(d => d.status === filter)
  const pending = deposits.filter(d => d.status === 'pending').length

  return (
    <>
      {pending > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          {pending} deposit{pending !== 1 ? 's' : ''} pending your approval.
        </div>
      )}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Deposits</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer', textTransform: 'capitalize',
                  background: filter === f ? '#111827' : '#fff', color: filter === f ? '#fff' : '#374151' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>ATP</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No {filter !== 'all' ? filter : ''} deposits.</td></tr>
              ) : filtered.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{d.profile?.atc_name || d.profile?.full_name || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{d.profile?.email}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#43a047', fontSize: '0.95rem' }}>${d.amount.toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.payment_method?.replace('_', ' ') ?? '—'}</td>
                  <td style={{ fontSize: '0.775rem', color: '#6b7280' }}>{d.reference || '—'}</td>
                  <td><span className={`badge badge-${d.status === 'approved' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'pending'}`}>{d.status}</span></td>
                  <td>
                    {d.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-success btn-sm" disabled={!!loading} onClick={() => approve(d)}>
                          {loading === d.id ? '...' : 'Approve'}
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={!!loading} onClick={() => reject(d)}>
                          {loading === d.id + '_reject' ? '...' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} entries</span></div>
      </div>
    </>
  )
}

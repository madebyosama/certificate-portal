'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DepositsClient({ deposits: initial }: { deposits: any[] }) {
  const router = useRouter()
  const [deposits, setDeposits] = useState<any[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [error, setError] = useState<string>('')

  async function approve(deposit: any) {
    setLoading(deposit.id)
    setError('')
    try {
      const res = await fetch('/api/admin/deposits/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: deposit.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to approve deposit')
        setLoading(null)
        return
      }
      // Reflect the new status locally and ask the server component
      // (which is what feeds the ATP's dashboard balance) to refresh.
      setDeposits(p => p.map(d => d.id === deposit.id ? { ...d, status: 'approved' } : d))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(null)
    }
  }

  async function reject(deposit: any) {
    setLoading(deposit.id + '_reject')
    setError('')
    try {
      const res = await fetch('/api/admin/deposits/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: deposit.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to reject deposit')
        setLoading(null)
        return
      }
      setDeposits(p => p.map(d => d.id === deposit.id ? { ...d, status: 'rejected' } : d))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(null)
    }
  }

  const filtered = filter === 'all' ? deposits : deposits.filter(d => d.status === filter)
  const pending = deposits.filter(d => d.status === 'pending').length

  return (
    <>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}
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
                    <div style={{ fontWeight: 500 }}>{d.profile?.atp_name || d.profile?.full_name || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{d.profile?.email}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#43a047', fontSize: '0.95rem' }}>${Number(d.amount).toFixed(2)}</td>
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

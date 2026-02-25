'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Deposit } from '@/lib/types'

interface Props {
  deposits: Deposit[]
  userId: string
  balance: number
}

export default function DepositClient({ deposits: initial, userId, balance: initialBalance }: Props) {
  const supabase = createClient()
  const [deposits, setDeposits] = useState<Deposit[]>(initial)
  const [balance] = useState(initialBalance)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', payment_method: 'bank_transfer', reference: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.from('deposits').insert({
      atc_id: userId,
      amount: Number(form.amount),
      payment_method: form.payment_method as any,
      reference: form.reference || null,
      notes: form.notes || null,
      status: 'pending',
    }).select().single()
    setLoading(false)

    if (error) { setError(error.message); return }
    setDeposits(prev => [data, ...prev])
    setForm({ amount: '', payment_method: 'bank_transfer', reference: '', notes: '' })
    setShowForm(false)
    setSuccess('Deposit request submitted. Awaiting admin approval.')
  }

  function statusBadge(status: string) {
    const cls = status === 'approved' ? 'badge-pass' : status === 'rejected' ? 'badge-fail' : 'badge-pending'
    return <span className={`badge ${cls}`}>{status}</span>
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">Account Balance</div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Available Balance</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--blue-600)' }}>${balance.toFixed(4)}</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '+ Request Deposit'}
            </button>
          </div>

          {showForm && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--gray-200)' }}>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Amount ($) <span className="required">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-input"
                      value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="stripe">Stripe</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference</label>
                    <input className="form-input" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} placeholder="Transaction reference..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? <><span className="spinner" /> Submitting...</> : 'Submit Request'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">Deposit History</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No deposits yet.</td></tr>
              ) : (
                deposits.map(d => (
                  <tr key={d.id}>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--green-500)' }}>+${d.amount.toFixed(2)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{d.payment_method?.replace('_', ' ') ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{d.reference ?? '—'}</td>
                    <td>{statusBadge(d.status)}</td>
                    <td>{d.notes ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {deposits.length} entries</span>
        </div>
      </div>
    </>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Deposit } from '@/lib/types'

interface Props { deposits: Deposit[]; userId: string; balance: number }

export default function DepositClient({ deposits: initial, userId, balance }: Props) {
  const supabase = createClient()
  const [deposits, setDeposits] = useState<Deposit[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', payment_method: 'bank_transfer', reference: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid amount.'); return }
    setLoading(true)
    const { data, error } = await supabase.from('deposits').insert({
      atc_id: userId, amount: Number(form.amount),
      payment_method: form.payment_method as any,
      reference: form.reference || null, notes: form.notes || null, status: 'pending',
    }).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setDeposits(p => [data, ...p])
    setForm({ amount: '', payment_method: 'bank_transfer', reference: '', notes: '' })
    setShowForm(false)
    setSuccess('Deposit request submitted. It will be approved by an admin.')
  }

  return (
    <>
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Account Balance</div>
        <div className="balance-row">
          <div>
            <div className="balance-label">Available Balance</div>
            <div className="balance-amount">${balance.toFixed(2)}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Funds'}
          </button>
        </div>

        {showForm && (
          <div style={{ padding: '0 18px 18px', borderTop: '1px solid #e5e7eb' }}>
            {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}
            <div style={{ marginTop: 14, marginBottom: 12, fontSize: '0.8rem', color: '#6b7280' }}>
              Submit a deposit request. Once approved by admin, funds will appear in your balance.
            </div>
            <form onSubmit={submit}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Amount ($) <span className="required">*</span></label>
                  <input type="number" step="0.01" min="1" className="form-input" value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reference / Transaction ID</label>
                  <input className="form-input" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} placeholder="e.g. TXN-12345" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? <><span className="spinner" /> Submitting...</> : 'Submit Deposit Request'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">Deposit History</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th></tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No deposits yet.</td></tr>
              ) : deposits.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600, color: '#43a047' }}>+${d.amount.toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.payment_method?.replace('_', ' ') ?? '—'}</td>
                  <td style={{ fontSize: '0.775rem', color: '#6b7280' }}>{d.reference ?? '—'}</td>
                  <td><span className={`badge badge-${d.status === 'approved' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'pending'}`}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{deposits.length} deposit{deposits.length !== 1 ? 's' : ''}</span></div>
      </div>
    </>
  )
}

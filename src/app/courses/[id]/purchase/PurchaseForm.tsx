'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  courseId: string; userId: string; courseName: string;
  coursePrice: number; numStudents: number; validityDays: number;
  purchaseFee: number; totalPrice: number; depositBalance: number;
  hasEnoughBalance: boolean;
}

export default function PurchaseForm({
  courseId, userId, courseName, coursePrice, numStudents,
  validityDays, purchaseFee, totalPrice, depositBalance, hasEnoughBalance,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [method, setMethod] = useState<'deposit' | 'stripe'>('deposit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handlePay() {
    setError(''); setSuccess('')
    if (method === 'deposit' && !hasEnoughBalance) {
      setError('Insufficient balance. Please deposit funds first.')
      return
    }
    setLoading(true)
    const invoiceNumber = `INV-${Date.now()}`

    const { error: invErr } = await supabase.from('invoices').insert({
      atc_id: userId, course_id: courseId, invoice_number: invoiceNumber,
      amount: totalPrice, status: 'paid', payment_method: method,
      paid_at: new Date().toISOString(),
    })
    if (invErr) { setError(invErr.message); setLoading(false); return }

    if (method === 'deposit') {
      const { data: p } = await supabase.from('profiles').select('deposit_balance').eq('id', userId).single()
      const newBal = (p?.deposit_balance ?? 0) - totalPrice
      await supabase.from('profiles').update({ deposit_balance: newBal }).eq('id', userId)
      await supabase.from('transactions').insert({
        atc_id: userId, type: 'debit', amount: totalPrice,
        description: `Course purchase: ${courseName}`,
        reference: invoiceNumber, balance_after: newBal,
      })
    }

    await supabase.from('courses').update({ status: 'approved' }).eq('id', courseId)
    setLoading(false)
    setSuccess('Payment successful! Course is now active.')
    setTimeout(() => router.push(`/courses/${courseId}`), 1500)
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary */}
      <div className="purchase-grid">
        <div className="purchase-label">Course</div>
        <div className="purchase-value">{courseName}</div>
        <div className="purchase-label">Students</div>
        <div className="purchase-value">{numStudents}</div>
        <div className="purchase-label">Price per Student</div>
        <div className="purchase-value">${coursePrice.toFixed(2)}</div>
        <div className="purchase-label">Validity</div>
        <div className="purchase-value">{validityDays} day{validityDays !== 1 ? 's' : ''}</div>
        {purchaseFee > 0 && <>
          <div className="purchase-label">Purchase Fee</div>
          <div className="purchase-value">${purchaseFee.toFixed(2)}</div>
        </>}
        <div className="purchase-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total</div>
        <div className="purchase-value" style={{ fontWeight: 700, fontSize: '1rem', color: '#1976d2' }}>${totalPrice.toFixed(2)}</div>
      </div>

      {/* Balance status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: hasEnoughBalance ? '#d1fae5' : '#fee2e2', borderRadius: 8, marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: hasEnoughBalance ? '#065f46' : '#b91c1c', fontWeight: 600, marginBottom: 2 }}>
            {hasEnoughBalance ? '✓ Sufficient Balance' : '✗ Insufficient Balance'}
          </div>
          <div style={{ fontSize: '0.85rem', color: hasEnoughBalance ? '#047857' : '#991b1b' }}>
            Available: <strong>${depositBalance.toFixed(2)}</strong>
            {!hasEnoughBalance && <> · Need: <strong>${(totalPrice - depositBalance).toFixed(2)} more</strong></>}
          </div>
        </div>
        {!hasEnoughBalance && (
          <a href="/deposit" className="btn btn-primary btn-sm">Add Funds →</a>
        )}
      </div>

      {/* Payment method */}
      <div style={{ marginBottom: 18 }}>
        <div className="form-label" style={{ marginBottom: 8 }}>Payment Method</div>
        <div className="radio-group">
          <label className="radio-item">
            <input type="radio" name="method" value="deposit" checked={method === 'deposit'} onChange={() => setMethod('deposit')} />
            Account Balance
          </label>
          <label className="radio-item">
            <input type="radio" name="method" value="stripe" checked={method === 'stripe'} onChange={() => setMethod('stripe')} />
            Credit Card (Stripe)
          </label>
        </div>
      </div>

      {method === 'stripe' && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Stripe integration coming soon. Please use your account balance for now.
        </div>
      )}

      <button
        className="btn btn-success"
        onClick={handlePay}
        disabled={loading || (method === 'deposit' && !hasEnoughBalance) || method === 'stripe'}
        style={{ fontSize: '0.95rem', padding: '10px 24px' }}
      >
        {loading ? <><span className="spinner" /> Processing...</> : `Confirm Payment · $${totalPrice.toFixed(2)}`}
      </button>
    </>
  )
}

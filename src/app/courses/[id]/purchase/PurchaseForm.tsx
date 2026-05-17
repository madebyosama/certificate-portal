'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  courseId: string
  userId: string
  courseName: string
  coursePrice: number
  /** Total students currently in the course (for display). */
  totalStudents: number
  /** Students that haven't been paid for yet — these drive the bill. */
  unpaidStudents: number
  durationDays: number
  /** True the first time the course is being activated. */
  isFirstPurchase: boolean
  totalPrice: number
  depositBalance: number
  hasEnoughBalance: boolean
}

export default function PurchaseForm({
  courseId,
  userId,
  courseName,
  coursePrice,
  totalStudents,
  unpaidStudents,
  durationDays,
  isFirstPurchase,
  totalPrice,
  depositBalance,
  hasEnoughBalance,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [method, setMethod] = useState<'deposit' | 'stripe'>('deposit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // No students at all -> the course cannot be registered/paid for.
  const noStudents = totalStudents === 0
  // Subsequent purchases with no unpaid students -> nothing to bill.
  const nothingToPay = noStudents || (!isFirstPurchase && unpaidStudents === 0)

  async function handlePay() {
    setError(''); setSuccess('')
    if (noStudents) {
      setError('A course must have at least one student before it can be registered and paid for.')
      return
    }
    if (nothingToPay) {
      setError('There are no unpaid students to charge for.')
      return
    }
    if (method === 'deposit' && !hasEnoughBalance) {
      setError('Insufficient balance. Please deposit funds first.')
      return
    }
    setLoading(true)
    const invoiceNumber = `INV-${Date.now()}`

    // 1) Record the invoice
    const { error: invErr } = await supabase.from('invoices').insert({
      atp_id: userId,
      course_id: courseId,
      invoice_number: invoiceNumber,
      amount: totalPrice,
      status: 'paid',
      payment_method: method,
      paid_at: new Date().toISOString(),
    })
    if (invErr) { setError(invErr.message); setLoading(false); return }

    // 2) Deduct from deposit balance and log the transaction
    if (method === 'deposit') {
      const { data: p } = await supabase
        .from('profiles')
        .select('deposit_balance')
        .eq('id', userId)
        .single()
      const newBal = (p?.deposit_balance ?? 0) - totalPrice
      await supabase.from('profiles').update({ deposit_balance: newBal }).eq('id', userId)
      await supabase.from('transactions').insert({
        atp_id: userId,
        type: 'debit',
        amount: totalPrice,
        description: `Student fee (${unpaidStudents}): ${courseName}`,
        reference: invoiceNumber,
        balance_after: newBal,
      })
    }

    // 3) Mark currently-unpaid candidates as paid so they're never re-billed.
    if (unpaidStudents > 0) {
      await supabase
        .from('candidates')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('course_id', courseId)
        .eq('paid', false)
    }

    // 4) Mark course active on first purchase.
    if (isFirstPurchase) {
      await supabase.from('courses').update({ status: 'approved' }).eq('id', courseId)
    }

    setLoading(false)
    setSuccess(
      isFirstPurchase
        ? 'Payment successful! The course is now registered and active — students are eligible for certificates.'
        : 'Payment successful! The new students are now eligible for certificates.'
    )
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

        <div className="purchase-label">Duration</div>
        <div className="purchase-value">{durationDays} day{durationDays !== 1 ? 's' : ''}</div>

        <div className="purchase-label">Students on Course</div>
        <div className="purchase-value">{totalStudents}</div>

        <div className="purchase-label">Unpaid Students</div>
        <div className="purchase-value">
          {unpaidStudents}
          {unpaidStudents === 0 && totalStudents > 0 && (
            <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#16a34a' }}>
              (all paid)
            </span>
          )}
        </div>

        <div className="purchase-label">Price per Student</div>
        <div className="purchase-value">${coursePrice.toFixed(2)}</div>

        {unpaidStudents > 0 && (
          <>
            <div className="purchase-label">Students Subtotal</div>
            <div className="purchase-value">
              ${(coursePrice * unpaidStudents).toFixed(2)}
            </div>
          </>
        )}

        <div className="purchase-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total</div>
        <div className="purchase-value" style={{ fontWeight: 700, fontSize: '1rem', color: '#1976d2' }}>
          ${totalPrice.toFixed(2)}
        </div>
      </div>

      {nothingToPay ? (
        <div className="alert alert-success" style={{ marginBottom: 14 }}>
          Nothing to pay — every student on this course has already been paid for.
        </div>
      ) : (
        <>
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
        </>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-success"
          onClick={handlePay}
          disabled={loading || nothingToPay || (method === 'deposit' && !hasEnoughBalance) || method === 'stripe'}
          style={{ fontSize: '0.95rem', padding: '10px 24px' }}
        >
          {loading
            ? <><span className="spinner" /> Processing...</>
            : `Pay for ${unpaidStudents} Student${unpaidStudents !== 1 ? 's' : ''} · $${totalPrice.toFixed(2)}`}
        </button>
        {isFirstPurchase && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => router.push(`/courses/${courseId}`)}
            disabled={loading}
            style={{ fontSize: '0.95rem', padding: '10px 24px' }}
          >
            Cancel
          </button>
        )}
      </div>
    </>
  )
}

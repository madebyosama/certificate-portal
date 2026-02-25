'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  courseId: string
  userId: string
  courseName: string
  coursePrice: number
  numPacks: number
  validityDays: number
  purchaseFee: number
  totalPrice: number
  depositBalance: number
  hasEnoughBalance: boolean
}

export default function PurchaseForm({
  courseId, userId, courseName, coursePrice, numPacks,
  validityDays, purchaseFee, totalPrice, depositBalance, hasEnoughBalance,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [paymentMethod, setPaymentMethod] = useState<'deposit' | 'stripe'>('deposit')
  const [cardNumber, setCardNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handlePurchase() {
    setError(''); setSuccess('')

    if (paymentMethod === 'deposit' && !hasEnoughBalance) {
      setError('Insufficient deposit balance. Please top up your account.')
      return
    }

    if (paymentMethod === 'stripe' && !cardNumber.trim()) {
      setError('Please enter your card number.')
      return
    }

    setLoading(true)

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Create invoice
    const { error: invoiceError } = await supabase.from('invoices').insert({
      atc_id: userId,
      course_id: courseId,
      invoice_number: invoiceNumber,
      amount: totalPrice,
      status: 'paid',
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
    })

    if (invoiceError) { setError(invoiceError.message); setLoading(false); return }

    if (paymentMethod === 'deposit') {
      // Deduct from deposit balance
      const { data: profile } = await supabase.from('profiles').select('deposit_balance').eq('id', userId).single()
      const newBalance = (profile?.deposit_balance ?? 0) - totalPrice
      await supabase.from('profiles').update({ deposit_balance: newBalance }).eq('id', userId)

      // Log transaction
      await supabase.from('transactions').insert({
        atc_id: userId,
        type: 'debit',
        amount: totalPrice,
        description: `Course purchase: ${courseName}`,
        reference: invoiceNumber,
        balance_after: newBalance,
      })
    }

    // Update course status to approved
    await supabase.from('courses').update({ status: 'approved' }).eq('id', courseId)

    setLoading(false)
    setSuccess('Payment successful! Your course has been approved.')
    setTimeout(() => router.push(`/courses/${courseId}`), 1500)
  }

  const rows = [
    { label: 'Course Name :', value: courseName },
    { label: 'Price :', value: `$ ${coursePrice.toFixed(2)}` },
    { label: 'Number of Packs', value: `${numPacks} Pack/s` },
    { label: 'Course Vaidity', value: `${validityDays} Day${validityDays !== 1 ? 's' : ''}` },
    { label: 'Purchase Fee:', value: `$ ${purchaseFee.toFixed(2)}` },
    { label: 'Total Price with Fee :', value: `$ ${totalPrice.toFixed(2)}` },
    { label: 'Payment From:', value: 'Deposit Account' },
    { label: 'Available Balance in Deposit:', value: `$ ${depositBalance.toFixed(4)}` },
  ]

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="purchase-detail" style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 20 }}>
        {rows.map(row => (
          <div key={row.label} className="purchase-row">
            <div className="purchase-label">{row.label}</div>
            <div className="purchase-value">{row.value}</div>
          </div>
        ))}
        <div className="purchase-label">Balance Status:</div>
        <div className="purchase-value">
          <span
            className={`badge ${hasEnoughBalance ? 'badge-pass' : 'badge-fail'}`}
            style={{ fontSize: '0.8rem' }}
          >
            {hasEnoughBalance ? 'balance is sufficient for this purchase' : 'insufficient balance'}
          </span>
        </div>
        <div className="purchase-label">Payment Method</div>
        <div className="purchase-value">
          <div className="radio-group">
            <label className="radio-item">
              <input
                type="radio"
                name="payment"
                value="deposit"
                checked={paymentMethod === 'deposit'}
                onChange={() => setPaymentMethod('deposit')}
              />
              Deposit Account
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
              />
              Stripe
            </label>
          </div>
        </div>
      </div>

      {paymentMethod === 'stripe' && (
        <div className="stripe-container" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>Stripe</div>
          <input
            className="stripe-input"
            type="text"
            placeholder="Card number"
            value={cardNumber}
            onChange={e => setCardNumber(e.target.value)}
            maxLength={19}
          />
          <button
            className="btn btn-primary"
            onClick={handlePurchase}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Processing...</> : 'Pay Now'}
          </button>
        </div>
      )}

      {paymentMethod === 'deposit' && (
        <button
          className="btn btn-success"
          onClick={handlePurchase}
          disabled={loading || !hasEnoughBalance}
        >
          {loading ? <><span className="spinner" /> Processing...</> : 'Confirm Purchase'}
        </button>
      )}
    </>
  )
}

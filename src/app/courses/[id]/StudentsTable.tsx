'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buildCertificateHtml } from '@/lib/certificate-template'
import type { Candidate } from '@/lib/types'

/**
 * Number of years a keyword-gated certificate stays valid for, measured
 * from its issue date.
 */
const CERTIFICATE_VALIDITY_YEARS = 5

/**
 * Certificates only carry an expiry date when the course title contains
 * the keyword "ISO" (capitalised, exact case) OR the exact word
 * "Certification" (case-sensitive). The match is a case-sensitive
 * substring test — e.g. "ISO 9001 Lead Auditor" and
 * "Project Management Certification" both qualify, but "iso" or
 * "certification" (lowercase) do not.
 *
 * When the rule matches, the expiry is the issue date plus
 * CERTIFICATE_VALIDITY_YEARS years. Otherwise it returns null and no
 * expiry is shown on the certificate.
 */
function computeCertificateExpiry(
  courseTitle: string,
  issueDateIso: string
): string | null {
  const titleQualifies =
    courseTitle.includes('ISO') || courseTitle.includes('Certification')
  if (!titleQualifies) return null

  const issued = new Date(issueDateIso)
  if (isNaN(issued.getTime())) return null

  const expiry = new Date(issued)
  expiry.setFullYear(expiry.getFullYear() + CERTIFICATE_VALIDITY_YEARS)
  return expiry.toISOString()
}

interface Course {
  id: string
  course_title: string
  start_date: string | null
  end_date: string | null
  reference_number: string | null
  trainer?: { first_name: string; last_name: string } | null
}

interface Profile {
  id: string
  atp_name: string | null
  atp_no: string | null
  atp_address: string | null
  deposit_balance: number | null
}

interface Settings {
  hardcopyPrice: number
  deliveryPrice: number
  taxRate: number
}

interface Props {
  candidates: Candidate[]
  course: Course
  profile: Profile
  settings: Settings
  logoUrl: string
}

export default function StudentsTable({
  candidates: initial,
  course,
  profile,
  settings,
  logoUrl,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Local copy so we can patch certificate_no after issuing
  const [candidates, setCandidates] = useState<Candidate[]>(initial)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Hard-copy order modal state
  const [orderFor, setOrderFor] = useState<Candidate | null>(null)

  /**
   * Issue (or return the existing) certificate number for a candidate.
   * The number is allocated atomically server-side via the
   * `issue_certificate_no` RPC and is locked once assigned, so calling
   * this more than once for the same candidate always returns the same
   * number. Returns the certificate number, or null on failure.
   */
  const issueCertNo = useCallback(
    async (c: Candidate): Promise<string | null> => {
      if (c.certificate_no) return c.certificate_no
      const { data, error: rpcErr } = await supabase.rpc(
        'issue_certificate_no',
        { p_candidate_id: c.id }
      )
      if (rpcErr || !data) return null
      const certNo = data as string
      const issuedAt = new Date().toISOString()
      setCandidates((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? {
                ...x,
                certificate_no: certNo,
                certificate_issued_at:
                  x.certificate_issued_at || issuedAt,
              }
            : x
        )
      )
      return certNo
    },
    [supabase]
  )

  /**
   * Auto-issue certificate numbers as soon as a student is eligible
   * (payment made + passed) — the number no longer waits for the user to
   * click "Download". This runs once per eligible candidate; the guard
   * ref prevents duplicate RPC calls across re-renders. Server-side the
   * number is locked, so even a duplicate call is harmless.
   */
  const autoIssuedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const pending = candidates.filter(
      (c) =>
        c.paid &&
        c.status === 'pass' &&
        !c.certificate_no &&
        !autoIssuedRef.current.has(c.id)
    )
    if (pending.length === 0) return
    pending.forEach((c) => autoIssuedRef.current.add(c.id))
    void Promise.all(pending.map((c) => issueCertNo(c)))
  }, [candidates, issueCertNo])

  const courseEligible = course && true // certificate available regardless; could gate on course.status === 'approved'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter((c) => {
      const name = `${c.first_name} ${c.last_name}`.toLowerCase()
      return (
        name.includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.country || '').toLowerCase().includes(q) ||
        (c.serial_no || '').toLowerCase().includes(q) ||
        (c.certificate_no || '').toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
      )
    })
  }, [candidates, search])

  /**
   * Issue (or fetch existing) certificate number, render the certificate
   * off-screen, and directly download it as a PDF file — no new tab and
   * no browser print dialog.
   */
  async function handleDownload(c: Candidate) {
    if (!c.paid) {
      setError(
        `Cannot issue a certificate — payment for ${c.first_name} ${c.last_name} has not been made yet.`
      )
      return
    }
    if (c.status !== 'pass') {
      setError(
        `Cannot issue a certificate — ${c.first_name} ${c.last_name} has not passed (status: ${c.status}).`
      )
      return
    }
    setError('')
    setBusyId(c.id)

    let certNo = c.certificate_no
    if (!certNo) {
      certNo = await issueCertNo(c)
      if (!certNo) {
        setError('Failed to issue certificate number.')
        setBusyId(null)
        return
      }
    }

    // Build absolute logo URL so it resolves while rendering off-screen
    const absoluteLogo = new URL(logoUrl, window.location.origin).toString()
    const issueDate = c.certificate_issued_at || new Date().toISOString()

    const html = buildCertificateHtml(
      {
        certificateNo: certNo!,
        candidateName: `${c.first_name} ${c.last_name}`,
        courseTitle: course.course_title,
        startDate: course.start_date,
        endDate: course.end_date,
        issueDate,
        expiryDate: computeCertificateExpiry(course.course_title, issueDate),
        atpName: profile.atp_name,
        atpNo: profile.atp_no,
        trainerName: course.trainer
          ? `${course.trainer.first_name} ${course.trainer.last_name}`
          : null,
        totalMarks: c.total_marks,
        status: c.status,
        logoUrl: absoluteLogo,
      },
      { forDownload: true }
    )

    // Render the certificate inside a hidden, off-screen iframe so we can
    // rasterise it without ever showing a new tab or print dialog.
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.left = '-10000px'
    iframe.style.top = '0'
    // A4 landscape at ~96dpi (297mm x 210mm) gives the renderer a stable box.
    iframe.style.width = '1123px'
    iframe.style.height = '794px'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }

    try {
      const doc = iframe.contentDocument
      if (!doc) throw new Error('Could not access the render frame.')
      doc.open()
      doc.write(html)
      doc.close()

      // Wait for the iframe document (incl. logo image) to finish loading.
      await new Promise<void>((resolve) => {
        const done = () => resolve()
        if (doc.readyState === 'complete') {
          // Give images/fonts a brief beat to settle.
          setTimeout(done, 350)
        } else {
          iframe.addEventListener('load', () => setTimeout(done, 350), {
            once: true,
          })
        }
      })

      const sheet = doc.querySelector('.sheet') as HTMLElement | null
      if (!sheet) throw new Error('Certificate failed to render.')

      // Lazy-load the heavy PDF libraries only when actually downloading.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: sheet.scrollWidth,
        windowHeight: sheet.scrollHeight,
      })

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH)

      const safeName = `${c.first_name}_${c.last_name}`
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/_+/g, '_')
      pdf.save(`Certificate_${certNo}_${safeName}.pdf`)
    } catch (err: any) {
      setError(
        err?.message
          ? `Could not generate the certificate PDF: ${err.message}`
          : 'Could not generate the certificate PDF. Please try again.'
      )
    } finally {
      cleanup()
      setBusyId(null)
    }
  }

  function openOrder(c: Candidate) {
    if (!c.paid) {
      setError(
        `Cannot order a hard copy — payment for ${c.first_name} ${c.last_name} has not been made yet.`
      )
      return
    }
    if (c.status !== 'pass') {
      setError(
        `Cannot order a hard copy — ${c.first_name} ${c.last_name} has not passed.`
      )
      return
    }
    setError('')
    setOrderFor(c)
  }

  async function handleDelete(c: Candidate) {
    if (c.paid) {
      setError(
        `Cannot delete ${c.first_name} ${c.last_name} — payment has already been made for this student.`
      )
      return
    }
    if (!confirm(`Remove ${c.first_name} ${c.last_name} from this course?`))
      return
    setError('')
    setBusyId(c.id)
    const { error: delErr } = await supabase
      .from('candidates')
      .delete()
      .eq('id', c.id)
      .eq('paid', false) // belt-and-braces: never delete a paid candidate
    setBusyId(null)
    if (delErr) {
      setError(delErr.message)
      return
    }
    setCandidates((prev) => prev.filter((x) => x.id !== c.id))
  }

  return (
    <>
      {error && (
        <div className='alert alert-error' style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className='card'>
        <div
          className='card-header'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Students ({candidates.length})</span>
        </div>

        <div className='table-controls'>
          <div className='table-search'>
            <span>🔍</span>
            <input
              type='text'
              placeholder='Search by name, email, serial, certificate no…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 280 }}
            />
            {search && (
              <button
                type='button'
                onClick={() => setSearch('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '0.85rem',
                }}
              >
                ✕
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#6b7280' }}>
            Showing {filtered.length} of {candidates.length}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className='data-table'>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Marks 1</th>
                <th>Marks 2</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Certificate No</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className='empty-state'>
                    {candidates.length === 0
                      ? 'No students yet.'
                      : 'No students match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td>
                      {c.first_name} {c.last_name}
                    </td>
                    <td>{c.email || '—'}</td>
                    <td>{c.country || '—'}</td>
                    <td>{c.assessment_marks_1 ?? '—'}</td>
                    <td>{c.assessment_marks_2 ?? '—'}</td>
                    <td>{c.total_marks}</td>
                    <td>
                      <span className={`badge badge-${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.paid ? (
                        <span
                          className='badge badge-approved'
                          title={
                            c.paid_at
                              ? `Paid on ${new Date(c.paid_at).toLocaleDateString()}`
                              : 'Paid'
                          }
                        >
                          paid
                        </span>
                      ) : (
                        <span
                          className='badge badge-pending'
                          title='Awaiting payment'
                        >
                          unpaid
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: c.certificate_no ? '#1976d2' : '#9ca3af',
                      }}
                    >
                      {c.certificate_no || '—'}
                    </td>
                    <td>
                      <div className='icon-btn-row'>
                        <button
                          type='button'
                          title={
                            !c.paid
                              ? 'Pay for this student to unlock the certificate'
                              : c.status !== 'pass'
                                ? `Cannot issue — status: ${c.status}`
                                : 'Download certificate (PDF)'
                          }
                          onClick={() => handleDownload(c)}
                          disabled={
                            busyId === c.id || !c.paid || c.status !== 'pass'
                          }
                          style={{
                            padding: 0,
                            background: 'transparent',
                            border: 'none',
                            cursor:
                              !c.paid || c.status !== 'pass'
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: !c.paid || c.status !== 'pass' ? 0.35 : 1,
                          }}
                        >
                          {busyId === c.id ? (
                            <span
                              className='spinner'
                              style={{
                                borderColor: '#cbd5e1',
                                borderTopColor: '#2B317A',
                                width: 22,
                                height: 22,
                              }}
                            />
                          ) : (
                            <svg
                              width='32'
                              height='32'
                              viewBox='0 0 32 32'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                fillRule='evenodd'
                                clipRule='evenodd'
                                d='M6.4 0H19.2L28.8 9.6V28.8C28.8 30.56 27.36 32 25.6 32H6.4C4.64 32 3.2 30.56 3.2 28.8V3.2C3.2 1.44 4.64 0 6.4 0ZM17.6 2.4L26.4 11.2H17.6V2.4Z'
                                fill='#2B317A'
                              />
                              <path
                                fillRule='evenodd'
                                clipRule='evenodd'
                                d='M23.6512 17.741H25.7069V15.9308H23.6512V14.9103H25.888L26.1899 12.9668H21.2333V20.5598H23.6512V17.741Z'
                                fill='white'
                              />
                              <path
                                fillRule='evenodd'
                                clipRule='evenodd'
                                d='M13.2551 12.9668V20.5598H16.6399C18.0021 20.5598 18.9371 20.2674 19.4448 19.6846C19.9526 19.1017 20.206 18.1281 20.206 16.7628C20.206 15.3985 19.9526 14.424 19.4448 13.8411C18.9371 13.2582 18.0021 12.9668 16.6399 12.9668H13.2551ZM15.673 14.9103H16.6765C17.0068 14.9103 17.2465 14.9489 17.3956 15.0262C17.5447 15.1025 17.6188 15.279 17.6188 15.5539V17.9718C17.6188 18.2476 17.5447 18.4232 17.3956 18.5004C17.2465 18.5777 17.0068 18.6153 16.6765 18.6153H15.673V14.9103Z'
                                fill='white'
                              />
                              <path
                                fillRule='evenodd'
                                clipRule='evenodd'
                                d='M8.36 18.72H9.93C10.33 18.72 10.67 18.66 10.97 18.53C11.27 18.4 11.5 18.24 11.67 18.06C12.12 17.56 12.35 16.8 12.35 15.77C12.35 13.9 11.48 12.97 9.75 12.97H5.94V20.56H8.36V18.72ZM8.36 16.78V14.91H8.92C9.21 14.91 9.42 14.94 9.55 15.0C9.68 15.06 9.75 15.2 9.75 15.42V16.27C9.75 16.49 9.68 16.63 9.55 16.69C9.42 16.75 9.21 16.78 8.92 16.78H8.36Z'
                                fill='white'
                              />
                              <path
                                d='M17.53 22.84L17.26 26.17L18.47 25.75C19.27 25.44 20.1 26.01 19.48 26.71C18.72 27.58 17.58 28.77 16.74 29.57C16.22 30.09 15.92 30.09 15.4 29.57C14.48 28.67 13.58 27.66 12.67 26.72C12.03 26.02 12.83 25.43 13.67 25.75L14.86 26.17C14.78 25.03 14.67 23.95 14.6 22.82C14.6 22.61 14.78 22.44 14.98 22.42C15.7 22.42 16.43 22.41 17.15 22.42C17.35 22.44 17.53 22.61 17.53 22.82V22.84Z'
                                fill='white'
                              />
                            </svg>
                          )}
                        </button>

                        <button
                          type='button'
                          title={
                            !c.paid
                              ? 'Pay for this student to unlock hard-copy ordering'
                              : c.status !== 'pass'
                                ? `Cannot order — status: ${c.status}`
                                : 'Order Hard Copy Certificate'
                          }
                          onClick={() => openOrder(c)}
                          disabled={!c.paid || c.status !== 'pass'}
                          style={{
                            padding: 0,
                            background: 'transparent',
                            border: 'none',
                            cursor:
                              !c.paid || c.status !== 'pass'
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: !c.paid || c.status !== 'pass' ? 0.35 : 1,
                          }}
                        >
                          <svg
                            width='32'
                            height='32'
                            viewBox='0 0 32 32'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              d='M3.2 7.2C3.2 5.435 4.635 4 6.4 4H20.8C22.565 4 24 5.435 24 7.2V8.8H26.535C27.385 8.8 28.2 9.135 28.8 9.735L31.065 12C31.665 12.6 32 13.415 32 14.265V21.6C32 23.365 30.565 24.8 28.8 24.8H28.635C28.115 26.645 26.415 28 24.4 28C22.385 28 20.69 26.645 20.165 24.8H15.035C14.515 26.645 12.815 28 10.8 28C8.785 28 7.09 26.645 6.565 24.8H6.4C4.635 24.8 3.2 23.365 3.2 21.6V19.2H1.2C0.535 19.2 0 18.665 0 18C0 17.335 0.535 16.8 1.2 16.8H6.8C7.465 16.8 8 16.265 8 15.6C8 14.935 7.465 14.4 6.8 14.4H1.2C0.535 14.4 0 13.865 0 13.2C0 12.535 0.535 12 1.2 12H10C10.665 12 11.2 11.465 11.2 10.8C11.2 10.135 10.665 9.6 10 9.6H1.2C0.535 9.6 0 9.065 0 8.4C0 7.735 0.535 7.2 1.2 7.2H3.2ZM28.8 16.8V14.265L26.535 12H24V16.8H28.8ZM12.8 23.6C12.8 22.495 11.905 21.6 10.8 21.6C9.695 21.6 8.8 22.495 8.8 23.6C8.8 24.705 9.695 25.6 10.8 25.6C11.905 25.6 12.8 24.705 12.8 23.6ZM24.4 25.6C25.505 25.6 26.4 24.705 26.4 23.6C26.4 22.495 25.505 21.6 24.4 21.6C23.295 21.6 22.4 22.495 22.4 23.6C22.4 24.705 23.295 25.6 24.4 25.6Z'
                              fill='#2B317A'
                            />
                          </svg>
                        </button>

                        {/* Delete — only allowed while still unpaid */}
                        {!c.paid && (
                          <button
                            type='button'
                            title='Remove this student (only available before payment)'
                            onClick={() => handleDelete(c)}
                            disabled={busyId === c.id}
                            style={{
                              padding: '4px 10px',
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: '#b91c1c',
                              fontWeight: 500,
                            }}
                          >
                            {busyId === c.id ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {orderFor && (
        <OrderHardCopyModal
          candidate={orderFor}
          course={course}
          profile={profile}
          settings={settings}
          onClose={() => setOrderFor(null)}
          onPlaced={() => {
            setOrderFor(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Hard-copy order modal                                              */
/* ------------------------------------------------------------------ */

function OrderHardCopyModal({
  candidate,
  course,
  profile,
  settings,
  onClose,
  onPlaced,
}: {
  candidate: Candidate
  course: Course
  profile: Profile
  settings: Settings
  onClose: () => void
  onPlaced: () => void
}) {
  const supabase = createClient()
  const [method, setMethod] = useState<'deposit' | 'stripe'>('deposit')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    recipient_name: `${candidate.first_name} ${candidate.last_name}`,
    address_line1: '',
    address_line2: '',
    city: '',
    state_region: '',
    postal_code: '',
    country: candidate.country || '',
    phone: '',
    notes: '',
  })

  const certificatePrice = Number(settings.hardcopyPrice) || 0
  const deliveryPrice = Number(settings.deliveryPrice) || 0
  const taxableBase = certificatePrice + deliveryPrice
  const taxAmount = Number(
    (taxableBase * Number(settings.taxRate || 0)).toFixed(2)
  )
  const total = Number((taxableBase + taxAmount).toFixed(2))

  const balance = Number(profile.deposit_balance || 0)
  const enoughBalance = balance >= total

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function place() {
    setError('')
    setSuccess('')

    // basic validation
    for (const [k, v] of Object.entries({
      recipient_name: form.recipient_name,
      address_line1: form.address_line1,
      city: form.city,
      postal_code: form.postal_code,
      country: form.country,
    })) {
      if (!v.trim()) {
        setError(`${k.replaceAll('_', ' ')} is required.`)
        return
      }
    }
    if (method === 'deposit' && !enoughBalance) {
      setError('Insufficient balance. Please add funds first.')
      return
    }
    if (method === 'stripe') {
      setError(
        'Card payments are coming soon — please use account balance for now.'
      )
      return
    }

    setLoading(true)

    // Ensure the candidate has a certificate number — issue one if needed
    let certNo = candidate.certificate_no
    if (!certNo) {
      const { data, error: rpcErr } = await supabase.rpc(
        'issue_certificate_no',
        {
          p_candidate_id: candidate.id,
        }
      )
      if (rpcErr || !data) {
        setError(rpcErr?.message || 'Failed to issue certificate number.')
        setLoading(false)
        return
      }
      certNo = data as string
    }

    const orderNumber = `CRT-ORD-${Date.now()}`

    const { error: insErr } = await supabase.from('certificate_orders').insert({
      order_number: orderNumber,
      atp_id: profile.id,
      candidate_id: candidate.id,
      course_id: course.id,
      certificate_no: certNo,
      recipient_name: form.recipient_name.trim(),
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim(),
      state_region: form.state_region.trim() || null,
      postal_code: form.postal_code.trim(),
      country: form.country.trim(),
      phone: form.phone.trim() || null,
      certificate_price: certificatePrice,
      delivery_price: deliveryPrice,
      tax_amount: taxAmount,
      total_amount: total,
      payment_method: method,
      status: 'paid',
      notes: form.notes.trim() || null,
      paid_at: new Date().toISOString(),
    })

    if (insErr) {
      setError(insErr.message)
      setLoading(false)
      return
    }

    // Deduct balance & log transaction
    if (method === 'deposit') {
      const newBal = Number((balance - total).toFixed(2))
      const { error: pErr } = await supabase
        .from('profiles')
        .update({ deposit_balance: newBal })
        .eq('id', profile.id)
      if (!pErr) {
        await supabase.from('transactions').insert({
          atp_id: profile.id,
          type: 'debit',
          amount: total,
          description: `Hard-copy certificate for ${candidate.first_name} ${candidate.last_name} (${certNo})`,
          reference: orderNumber,
          balance_after: newBal,
        })
      }
    }

    // Also log into other_invoices so it appears in the invoices view
    await supabase.from('other_invoices').insert({
      atp_id: profile.id,
      description: `Hard-copy certificate · ${certNo} · ${form.recipient_name.trim()}`,
      amount: total,
      status: 'paid',
    })

    setLoading(false)
    setSuccess(
      `Order placed — ${orderNumber}. It will be printed and shipped shortly.`
    )
    setTimeout(onPlaced, 1500)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,22,40,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            background: '#0a1628',
            color: '#fff',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>
              Order Hard Copy Certificate
            </div>
            <div style={{ fontSize: '0.775rem', opacity: 0.7, marginTop: 2 }}>
              {candidate.first_name} {candidate.last_name} ·{' '}
              {course.course_title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#fff',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {error && (
            <div className='alert alert-error' style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          {success && (
            <div className='alert alert-success' style={{ marginBottom: 12 }}>
              {success}
            </div>
          )}

          <div className='section-title' style={{ marginTop: 0 }}>
            Delivery Address
          </div>

          <div className='form-grid'>
            <div className='form-group full-width'>
              <label className='form-label'>
                Recipient Name <span className='required'>*</span>
              </label>
              <input
                className='form-input'
                value={form.recipient_name}
                onChange={(e) => set('recipient_name', e.target.value)}
              />
            </div>
            <div className='form-group full-width'>
              <label className='form-label'>
                Address Line 1 <span className='required'>*</span>
              </label>
              <input
                className='form-input'
                value={form.address_line1}
                onChange={(e) => set('address_line1', e.target.value)}
                placeholder='Street address'
              />
            </div>
            <div className='form-group full-width'>
              <label className='form-label'>Address Line 2</label>
              <input
                className='form-input'
                value={form.address_line2}
                onChange={(e) => set('address_line2', e.target.value)}
                placeholder='Apartment, suite, etc. (optional)'
              />
            </div>
            <div className='form-group'>
              <label className='form-label'>
                City <span className='required'>*</span>
              </label>
              <input
                className='form-input'
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
            <div className='form-group'>
              <label className='form-label'>State / Region</label>
              <input
                className='form-input'
                value={form.state_region}
                onChange={(e) => set('state_region', e.target.value)}
              />
            </div>
            <div className='form-group'>
              <label className='form-label'>
                Postal Code <span className='required'>*</span>
              </label>
              <input
                className='form-input'
                value={form.postal_code}
                onChange={(e) => set('postal_code', e.target.value)}
              />
            </div>
            <div className='form-group'>
              <label className='form-label'>
                Country <span className='required'>*</span>
              </label>
              <input
                className='form-input'
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
              />
            </div>
            <div className='form-group full-width'>
              <label className='form-label'>Phone (for courier)</label>
              <input
                className='form-input'
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div className='form-group full-width'>
              <label className='form-label'>
                Notes for printing / delivery
              </label>
              <textarea
                className='form-textarea'
                rows={2}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </div>

          <div className='section-title'>Order Summary</div>
          <div className='purchase-grid'>
            <div className='purchase-label'>Hard-copy certificate</div>
            <div className='purchase-value'>${certificatePrice.toFixed(2)}</div>
            <div className='purchase-label'>Delivery</div>
            <div className='purchase-value'>${deliveryPrice.toFixed(2)}</div>
            <div className='purchase-label'>
              Tax ({(Number(settings.taxRate || 0) * 100).toFixed(2)}%)
            </div>
            <div className='purchase-value'>${taxAmount.toFixed(2)}</div>
            <div
              className='purchase-label'
              style={{ fontWeight: 700, fontSize: '0.9rem' }}
            >
              Total
            </div>
            <div
              className='purchase-value'
              style={{ fontWeight: 700, fontSize: '1rem', color: '#1976d2' }}
            >
              ${total.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: enoughBalance ? '#d1fae5' : '#fee2e2',
              borderRadius: 8,
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: enoughBalance ? '#065f46' : '#b91c1c',
                  fontWeight: 600,
                }}
              >
                {enoughBalance
                  ? '✓ Sufficient balance'
                  : '✗ Insufficient balance'}
              </div>
              <div
                style={{
                  fontSize: '0.825rem',
                  color: enoughBalance ? '#047857' : '#991b1b',
                }}
              >
                Available: <strong>${balance.toFixed(2)}</strong>
                {!enoughBalance && (
                  <>
                    {' '}
                    · Need:{' '}
                    <strong>${(total - balance).toFixed(2)} more</strong>
                  </>
                )}
              </div>
            </div>
            {!enoughBalance && (
              <a href='/deposit' className='btn btn-primary btn-sm'>
                Add Funds →
              </a>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div className='form-label' style={{ marginBottom: 8 }}>
              Payment Method
            </div>
            <div className='radio-group'>
              <label className='radio-item'>
                <input
                  type='radio'
                  name='ordermethod'
                  value='deposit'
                  checked={method === 'deposit'}
                  onChange={() => setMethod('deposit')}
                />
                Account Balance
              </label>
              <label className='radio-item'>
                <input
                  type='radio'
                  name='ordermethod'
                  value='stripe'
                  checked={method === 'stripe'}
                  onChange={() => setMethod('stripe')}
                />
                Credit Card (coming soon)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type='button'
              className='btn btn-outline'
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type='button'
              className='btn btn-success'
              onClick={place}
              disabled={
                loading ||
                (method === 'deposit' && !enoughBalance) ||
                method === 'stripe'
              }
            >
              {loading ? (
                <>
                  <span className='spinner' /> Placing order…
                </>
              ) : (
                <>Confirm Order · ${total.toFixed(2)}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

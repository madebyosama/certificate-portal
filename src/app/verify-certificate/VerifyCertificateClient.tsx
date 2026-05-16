'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type State = 'valid' | 'expired' | 'not_found'

interface VerifyResult {
  state: State
  certificateNo: string
  studentName?: string
  courseName?: string
  issueDate?: string | null
  expiryDate?: string | null
}

function fmt(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

const PALETTE: Record<
  State,
  { bg: string; border: string; text: string; accent: string; label: string; icon: string }
> = {
  valid: {
    bg: '#e8f5e9',
    border: '#43a047',
    text: '#1b5e20',
    accent: '#2e7d32',
    label: 'Certificate Verified',
    icon: '✓',
  },
  expired: {
    bg: '#fff3e0',
    border: '#fb8c00',
    text: '#e65100',
    accent: '#ef6c00',
    label: 'Certificate Expired',
    icon: '!',
  },
  not_found: {
    bg: '#ffebee',
    border: '#e53935',
    text: '#b71c1c',
    accent: '#c62828',
    label: 'Not Verified',
    icon: '✕',
  },
}

export default function VerifyCertificateClient({
  initialCert,
}: {
  initialCert: string
}) {
  const [value, setValue] = useState(initialCert)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const autoRan = useRef(false)

  const verify = useCallback(async (certNo: string) => {
    const trimmed = certNo.trim()
    if (!trimmed) {
      setError('Please enter a certificate number.')
      setResult(null)
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(
        `/api/verify-certificate?cert=${encodeURIComponent(trimmed)}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Could not verify this certificate.')
        setLoading(false)
        return
      }
      setResult(data as VerifyResult)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // If a ?cert= was supplied (e.g. via the QR code on the certificate),
  // verify automatically on first load — no input needed.
  useEffect(() => {
    if (initialCert && !autoRan.current) {
      autoRan.current = true
      void verify(initialCert)
    }
  }, [initialCert, verify])

  const pal = result ? PALETTE[result.state] : null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f7f9fc 0%, #eef2f8 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 20px 64px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-logo.png"
            alt="UKQAM"
            style={{ height: 46, width: 'auto', marginBottom: 18 }}
          />
          <span
            style={{
              display: 'inline-block',
              background: '#e3f2fd',
              color: '#1565c0',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 999,
              letterSpacing: '0.02em',
            }}
          >
            Verify Certificate
          </span>
          <h1
            style={{
              fontSize: '2.25rem',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#0a1628',
              textAlign: 'center',
              margin: '16px 0 10px',
            }}
          >
            Verify Your
            <br />
            Certification
          </h1>
          <p
            style={{
              color: '#6b7280',
              textAlign: 'center',
              fontSize: '1rem',
              maxWidth: 320,
              margin: 0,
            }}
          >
            Verify the authenticity of your certification with our easy tool.
          </p>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={value}
            placeholder="Enter your certificate no."
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') verify(value)
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 18px',
              fontSize: '0.95rem',
              textAlign: 'center',
              border: '1px solid #d4dae6',
              borderRadius: 12,
              outline: 'none',
              background: '#fff',
              color: '#0a1628',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          />
          <button
            type="button"
            onClick={() => verify(value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px 18px',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#fff',
              background: loading ? '#3a4191' : '#2B317A',
              border: 'none',
              borderRadius: 12,
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'background 0.15s',
            }}
          >
            {loading && (
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'vc-spin 0.7s linear infinite',
                }}
              />
            )}
            {loading ? 'Searching…' : 'Search Certificate'}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#ffebee',
              color: '#c62828',
              borderLeft: '3px solid #e53935',
              borderRadius: 8,
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {result && pal && (
          <div
            role="status"
            style={{
              marginTop: 20,
              background: pal.bg,
              border: `1px solid ${pal.border}`,
              borderRadius: 14,
              padding: '22px 22px 24px',
              animation: 'vc-fade 0.25s ease-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom:
                  result.state === 'valid' ? 18 : 4,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: pal.accent,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                }}
              >
                {pal.icon}
              </span>
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: pal.text,
                }}
              >
                {pal.label}
              </span>
            </div>

            {result.state === 'not_found' && (
              <p
                style={{
                  margin: '6px 0 0 46px',
                  color: pal.text,
                  fontSize: '0.875rem',
                }}
              >
                No certificate matches{' '}
                <strong
                  style={{ fontFamily: 'monospace' }}
                >
                  {result.certificateNo}
                </strong>
                . Please check the number and try again.
              </p>
            )}

            {(result.state === 'valid' ||
              result.state === 'expired') && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  rowGap: 10,
                  columnGap: 14,
                  fontSize: '0.875rem',
                  color: pal.text,
                }}
              >
                <Label>Certificate No</Label>
                <Val mono>{result.certificateNo}</Val>

                <Label>Student Name</Label>
                <Val>{result.studentName || '—'}</Val>

                <Label>Course</Label>
                <Val>{result.courseName || '—'}</Val>

                <Label>Issue Date</Label>
                <Val>{fmt(result.issueDate)}</Val>

                {result.expiryDate && (
                  <>
                    <Label>
                      {result.state === 'expired'
                        ? 'Expired On'
                        : 'Valid Until'}
                    </Label>
                    <Val>{fmt(result.expiryDate)}</Val>
                  </>
                )}

                {result.state === 'expired' && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      marginTop: 6,
                      fontSize: '0.825rem',
                      fontStyle: 'italic',
                    }}
                  >
                    This certificate was authentic but has passed its
                    validity period.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p
          style={{
            marginTop: 28,
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#9ca3af',
          }}
        >
          © {new Date().getFullYear()} UKQAM — UK Qualification Awarding
          Membership
        </p>
      </div>

      <style>{`
        @keyframes vc-spin { to { transform: rotate(360deg); } }
        @keyframes vc-fade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        opacity: 0.7,
        fontWeight: 600,
        paddingTop: 2,
      }}
    >
      {children}
    </div>
  )
}

function Val({
  children,
  mono,
}: {
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div
      style={{
        fontWeight: 600,
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </div>
  )
}

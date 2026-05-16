import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  computeCertificateExpiry,
  isExpired,
  type CertificateState,
} from '@/lib/certificate-validity'

/**
 * PUBLIC, UNAUTHENTICATED endpoint.
 *
 * Looks up a certificate by its number and reports whether it is valid,
 * expired, or not found. Because anonymous callers have no Supabase
 * session (and per-ATP RLS would hide every row), this route uses the
 * service-role admin client. To keep that safe it only ever:
 *   - matches an EXACT certificate number (no listing / enumeration of
 *     other fields),
 *   - returns a deliberately small, non-sensitive projection
 *     (student name, course, dates) and never emails, marks, IDs, etc.
 */

export const dynamic = 'force-dynamic'

interface VerifyResult {
  state: CertificateState
  certificateNo: string
  studentName?: string
  courseName?: string
  issueDate?: string | null
  expiryDate?: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = (searchParams.get('cert') || '').trim()

  if (!raw) {
    return NextResponse.json(
      { error: 'A certificate number is required.' },
      { status: 400 }
    )
  }

  // Guard against absurd inputs before hitting the database.
  if (raw.length > 64) {
    const body: VerifyResult = { state: 'not_found', certificateNo: raw }
    return NextResponse.json(body, { status: 200 })
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'Verification service is not configured.' },
      { status: 500 }
    )
  }

  // Exact match on the (already unique) certificate number.
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(
      'first_name, last_name, status, certificate_no, certificate_issued_at, course_id'
    )
    .eq('certificate_no', raw)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: 'Could not verify the certificate. Please try again.' },
      { status: 500 }
    )
  }

  // No such certificate, or it was issued to a candidate who did not pass.
  if (!candidate || candidate.status !== 'pass') {
    const body: VerifyResult = { state: 'not_found', certificateNo: raw }
    return NextResponse.json(body, { status: 200 })
  }

  // Pull the matching course title for the expiry rule + display.
  let courseTitle = ''
  if (candidate.course_id) {
    const { data: course } = await supabase
      .from('courses')
      .select('course_title')
      .eq('id', candidate.course_id)
      .maybeSingle()
    courseTitle = course?.course_title || ''
  }

  const issueDate =
    candidate.certificate_issued_at || null
  const expiryDate = issueDate
    ? computeCertificateExpiry(courseTitle, issueDate)
    : null

  const expired = isExpired(expiryDate)

  const body: VerifyResult = {
    state: expired ? 'expired' : 'valid',
    certificateNo: candidate.certificate_no as string,
    studentName:
      `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
    courseName: courseTitle || '—',
    issueDate,
    expiryDate,
  }

  return NextResponse.json(body, { status: 200 })
}

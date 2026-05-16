/**
 * Shared certificate validity / expiry rules.
 *
 * This module is the SINGLE source of truth for:
 *   1. how long a keyword-gated certificate stays valid, and
 *   2. whether a given certificate is currently valid / expired.
 *
 * It is imported by both the issuing UI (StudentsTable) and the public
 * verification endpoint so the two can never disagree.
 */

/**
 * Number of years a keyword-gated certificate stays valid for, measured
 * from its issue date.
 */
export const CERTIFICATE_VALIDITY_YEARS = 5

/**
 * Certificates only carry an expiry date when the course title contains
 * the keyword "ISO" (capitalised, exact case) OR the exact word
 * "Certification" (case-sensitive). The match is a case-sensitive
 * substring test — e.g. "ISO 9001 Lead Auditor" and
 * "Project Management Certification" both qualify, but "iso" or
 * "certification" (lowercase) do not.
 *
 * When the rule matches, the expiry is the issue date plus
 * CERTIFICATE_VALIDITY_YEARS years. Otherwise it returns null and the
 * certificate never expires.
 */
export function computeCertificateExpiry(
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

export type CertificateState = 'valid' | 'expired' | 'not_found'

/**
 * Given an expiry ISO string (or null = never expires), decide whether
 * the certificate is still valid or has expired. A null expiry always
 * resolves to "valid".
 */
export function isExpired(
  expiryIso: string | null,
  now: Date = new Date()
): boolean {
  if (!expiryIso) return false
  const exp = new Date(expiryIso)
  if (isNaN(exp.getTime())) return false
  return now.getTime() > exp.getTime()
}

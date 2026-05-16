import type { Metadata } from 'next'
import VerifyCertificateClient from './VerifyCertificateClient'

export const metadata: Metadata = {
  title: 'Verify Certificate · UKQAM',
  description:
    'Verify the authenticity of a UKQAM certification. Public certificate validation tool.',
}

export const dynamic = 'force-dynamic'

export default async function VerifyCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ cert?: string | string[] }>
}) {
  const sp = await searchParams
  const rawCert = Array.isArray(sp.cert) ? sp.cert[0] : sp.cert
  const initialCert = (rawCert || '').trim()

  return <VerifyCertificateClient initialCert={initialCert} />
}

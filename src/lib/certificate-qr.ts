import QRCode from 'qrcode'

/**
 * Build the absolute public URL that verifies a given certificate.
 * The QR code on the certificate encodes this URL; opening it lands the
 * viewer on the public verify page which auto-checks the certificate and
 * shows only valid / expired / not-found (no input required).
 */
export function buildVerifyUrl(origin: string, certificateNo: string): string {
  const base = origin.replace(/\/+$/, '')
  return `${base}/verify-certificate?cert=${encodeURIComponent(certificateNo)}`
}

/**
 * Generate a self-contained QR-code SVG (string) for the verification URL
 * of a certificate. Returns null if generation fails so the certificate
 * can still be produced without a QR code rather than failing outright.
 */
export async function buildVerifyQrSvg(
  origin: string,
  certificateNo: string
): Promise<string | null> {
  try {
    const url = buildVerifyUrl(origin, certificateNo)
    const svg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      color: { dark: '#0a1628', light: '#ffffff' },
    })
    return svg
  } catch {
    return null
  }
}

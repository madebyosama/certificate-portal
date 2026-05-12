/**
 * Certificate HTML template builder.
 *
 * Produces a fully self-contained HTML document (string) that renders
 * a landscape A4 certificate. The document auto-triggers window.print()
 * so the user can save it as a PDF via the browser's native print dialog.
 *
 * No external dependencies — works in any modern browser.
 */

export interface CertificateData {
  certificateNo: string
  candidateName: string
  courseTitle: string
  startDate: string | null
  endDate: string | null
  issueDate: string
  atpName: string | null
  atpNo: string | null
  trainerName: string | null
  totalMarks: number | null
  status: string
  logoUrl: string
}

function fmt(d: string | null): string {
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

function escape(s: string | null | undefined): string {
  if (s == null) return ''
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Inline SVG signature — we render the CEO signature as an SVG path
 * so the certificate stays self-contained with no external assets.
 * Styled to look like a hand-written signature.
 */
const CEO_SIGNATURE_SVG = `
<svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" style="height:60px;width:auto;">
  <g fill="none" stroke="#0a1f4d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10,55 C 25,20 40,15 55,40 C 60,55 50,68 35,65 C 25,63 30,45 45,42 C 60,40 75,55 70,72"/>
    <path d="M80,60 C 90,30 100,32 105,50 C 108,62 100,68 95,58 C 92,52 100,40 115,42 C 125,44 128,55 122,65"/>
    <path d="M130,55 L 140,30 L 150,55 M 134,48 L 146,48"/>
    <path d="M158,60 C 165,40 175,38 180,52 C 183,62 175,68 168,60"/>
    <path d="M190,30 L 190,68 M 190,50 C 205,30 220,40 215,55 C 212,65 200,68 192,60"/>
    <path d="M225,40 C 240,25 255,35 250,55 C 245,68 230,72 220,65"/>
    <path d="M260,42 L 260,68 M 260,55 C 275,40 290,48 285,62"/>
    <path d="M5,80 C 80,75 160,82 230,78 C 260,76 285,80 305,82" stroke-width="1.2" opacity="0.7"/>
  </g>
</svg>
`

export function buildCertificateHtml(d: CertificateData): string {
  const title = `Certificate ${d.certificateNo}`

  // Use a dedicated crown URL for the watermark (passed separately or fall back to logo)
  const watermarkUrl = d.logoUrl.replace('login-logo.png', 'logo.png')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escape(title)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; font-family: 'Georgia', 'Times New Roman', serif; color: #0a1628; background: #e8edf5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { display: flex; align-items: center; justify-content: center; padding: 0; }
  .sheet { width: 297mm; height: 210mm; background: #fff; position: relative; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }

  /* Decorative borders */
  .border-outer { position: absolute; top: 10mm; right: 10mm; bottom: 10mm; left: 10mm; border: 3px double #2B317A; pointer-events: none; }
  .border-inner { position: absolute; top: 13mm; right: 13mm; bottom: 13mm; left: 13mm; border: 1px solid #b8860b; pointer-events: none; }

  /* Watermark crown */
  .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.06; pointer-events: none; width: 360px; height: 360px; display: flex; align-items: center; justify-content: center; }
  .watermark img { width: 100%; height: auto; }

  /* Content */
  .content { position: relative; height: 100%; padding: 14mm 25mm 70mm; display: flex; flex-direction: column; align-items: center; text-align: center; }

  /* Header */
  .logo-block { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 3mm; }
  .logo-block img { height: 16mm; width: auto; }
  .org-sub { font-size: 8pt; letter-spacing: 3px; color: #6b7280; text-transform: uppercase; }

  /* Title */
  .title { font-size: 28pt; letter-spacing: 8px; color: #2B317A; font-weight: 700; margin: 1mm 0 0; }
  .title-sub { font-size: 8.5pt; letter-spacing: 4px; color: #b8860b; text-transform: uppercase; margin-top: 1mm; }
  .title-underline { width: 70mm; height: 2px; background: linear-gradient(90deg, transparent, #b8860b, transparent); margin: 2mm auto 3mm; }

  /* Body */
  .preamble { font-size: 10.5pt; color: #374151; letter-spacing: 1px; font-style: italic; }
  .recipient { font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', cursive; font-size: 34pt; color: #0a1628; margin: 3mm 0 1mm; font-weight: 400; line-height: 1; }
  .recipient-underline { width: 130mm; border-bottom: 1px solid #9ca3af; margin: 0 auto 3mm; }

  .achievement { font-size: 10pt; color: #374151; line-height: 1.5; max-width: 200mm; margin: 0 auto; }
  .course-title { font-size: 13pt; color: #2B317A; font-weight: 700; margin: 2mm 0; font-style: italic; }

  /* Meta — use flexbox (more portable than grid for some PDF renderers) */
  .meta-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 3mm 0; margin: 3mm auto 0; max-width: 230mm; width: 100%; }
  .meta-item { flex: 0 0 33.33%; text-align: center; padding: 0 4mm; box-sizing: border-box; }
  .meta-label { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 1px; }
  .meta-value { font-weight: 600; color: #111827; font-size: 9pt; }

  /* Footer — anchored to bottom, generous clearance */
  .footer { position: absolute; bottom: 20mm; left: 22mm; right: 22mm; display: flex; justify-content: space-between; align-items: flex-end; }
  .sig-block { text-align: center; width: 75mm; }
  .sig-image { height: 14mm; display: flex; align-items: flex-end; justify-content: center; }
  .sig-line { border-bottom: 1px solid #374151; margin: 1mm 0 2mm; }
  .sig-name { font-size: 9pt; font-weight: 700; color: #111827; }
  .sig-role { font-size: 7pt; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; margin-top: 1mm; }

  .seal { width: 28mm; height: 28mm; border: 2px solid #b8860b; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #b8860b; padding: 3mm; position: relative; background: rgba(255,255,255,0.9); }
  .seal::before { content: ''; position: absolute; inset: 2mm; border: 1px dashed #b8860b; border-radius: 50%; }
  .seal-text { font-size: 6pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; line-height: 1.2; }
  .seal-star { font-size: 14pt; margin: 1mm 0; }

  .cert-id { position: absolute; bottom: 6mm; left: 0; right: 0; text-align: center; font-size: 7pt; color: #6b7280; letter-spacing: 2px; font-family: 'Courier New', monospace; }

  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; }
    .no-print { display: none !important; }
  }

  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0a1628; color: #fff; padding: 12px 20px; display: flex; gap: 10px; align-items: center; justify-content: center; z-index: 1000; font-family: 'Inter', system-ui, sans-serif; font-size: 14px; }
  .print-bar button { background: #1976d2; color: #fff; border: none; padding: 8px 18px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 13px; }
  .print-bar button:hover { background: #1565c0; }
  .print-bar .hint { opacity: 0.7; font-size: 12px; }
</style>
</head>
<body>
  <div class="print-bar no-print">
    <span>📄 Certificate ready — save as PDF from the print dialog</span>
    <button onclick="window.print()">Print / Save as PDF</button>
    <span class="hint">(Choose “Save as PDF” in the destination)</span>
  </div>

  <div class="sheet">
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <div class="watermark"><img src="${escape(watermarkUrl)}" alt="" /></div>

    <div class="content">
      <div class="logo-block">
        <img src="${escape(d.logoUrl)}" alt="UKQAM" />
        <div class="org-sub">UK Qualification Awarding Membership</div>
      </div>

      <div class="title">CERTIFICATE</div>
      <div class="title-sub">of Achievement</div>
      <div class="title-underline"></div>

      <div class="preamble">This is to certify that</div>
      <div class="recipient">${escape(d.candidateName)}</div>
      <div class="recipient-underline"></div>

      <div class="achievement">
        has successfully completed the requirements for
        <div class="course-title">${escape(d.courseTitle)}</div>
        and is hereby awarded this certificate in recognition of demonstrated knowledge,
        competence, and successful assessment in the prescribed syllabus.
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Start Date</div>
          <div class="meta-value">${escape(fmt(d.startDate))}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Completion Date</div>
          <div class="meta-value">${escape(fmt(d.endDate))}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Result</div>
          <div class="meta-value" style="text-transform:uppercase;">${escape(d.status)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Trainer</div>
          <div class="meta-value">${escape(d.trainerName || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Training Centre</div>
          <div class="meta-value">${escape(d.atpName || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Centre ID</div>
          <div class="meta-value">${escape(d.atpNo || '—')}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="sig-block">
        <div class="sig-image">${CEO_SIGNATURE_SVG}</div>
        <div class="sig-line"></div>
        <div class="sig-name">Dr. J. Whitmore</div>
        <div class="sig-role">Chief Executive Officer · UKQAM</div>
      </div>

      <div class="seal">
        <div class="seal-text">UKQAM</div>
        <div class="seal-star">★</div>
        <div class="seal-text">Verified</div>
      </div>

      <div class="sig-block">
        <div class="sig-image" style="font-family:'Brush Script MT','Apple Chancery',cursive;font-size:18pt;color:#0a1f4d;align-items:center;padding-bottom:3mm;white-space:nowrap;overflow:hidden;">Authorized Signatory</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escape(d.atpName || 'Training Centre')}</div>
        <div class="sig-role">Approved Training Centre</div>
      </div>
    </div>

    <div class="cert-id">CERTIFICATE NO: ${escape(d.certificateNo)} &nbsp;·&nbsp; ISSUED ${escape(fmt(d.issueDate))}</div>
  </div>

  <script>
    // Give the browser a beat to render fonts/images, then open the print dialog.
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>
</body>
</html>`
}

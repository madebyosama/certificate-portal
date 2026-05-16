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
  /**
   * Expiry/valid-until date. Only populated for courses whose title
   * contains the keyword "ISO" (capitalised) or "Certification" (exact
   * case). When null, no expiry is shown on the certificate.
   */
  expiryDate: string | null
  atpName: string | null
  atpNo: string | null
  trainerName: string | null
  totalMarks: number | null
  status: string
  logoUrl: string
  /**
   * Pre-rendered, self-contained QR-code SVG markup that points at the
   * public certificate-verification page for this certificate. When
   * present it is rendered in the certificate footer. Scanning it takes
   * the viewer straight to the verify page, which shows only whether the
   * certificate is valid/expired/not-found (no input required).
   */
  qrSvg?: string | null
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
<svg width="237" height="138" viewBox="0 0 237 138" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M156.032 64.9779C158.719 66.1035 161.154 63.5721 159.707 60.8433C157.171 57.3932 152.067 62.7406 156.032 64.9779Z" fill="#020202" fill-opacity="0.92" stroke="black" stroke-width="0.459403"/>
<path d="M92.505 6.30339C96.2996 7.24976 98.1832 1.54857 94.802 0.331149C90.9568 -0.560094 88.8068 4.68629 92.505 6.30339Z" stroke="black" stroke-width="0.137821"/>
<path d="M92.5049 6.30329C96.6717 8.12253 98.8952 1.28202 94.8019 0.331055C98.1831 1.54847 96.2996 7.24967 92.5049 6.30329Z" stroke="white" stroke-opacity="0.35" stroke-width="0.137821"/>
<path d="M92.505 6.30339C96.2996 7.24976 98.1832 1.54857 94.802 0.331149C90.9568 -0.560094 88.8068 4.68629 92.505 6.30339Z" fill="black" stroke="black" stroke-width="0.459403"/>
<path d="M80.2142 47.4866C78.2066 51.4145 75.2205 54.906 73.7826 58.9717C74.242 58.9717 74.7014 58.9717 75.1608 58.9717C78.0458 57.4924 78.666 52.7192 80.7793 50.3487C82.8925 47.9782 83.793 43.9997 85.3825 41.1698C86.972 38.3399 88.6259 34.6371 89.4023 31.4075C89.6687 30.3003 89.4574 29.1243 90.3211 28.1917C90.6656 31.1456 89.5355 36.0842 89.4023 40.5956C88.0654 46.4346 87.2247 51.9888 87.1053 58.0529C87.0455 60.9379 86.8067 64.5259 86.1956 67.2501C85.5892 69.979 86.8388 74.3066 85.2676 76.429C85.2676 76.429 85.2676 76.6587 85.2676 76.8884C85.2676 83.2695 85.6995 86.7196 78.3766 86.0765C74.9173 85.7733 71.1456 86.127 67.8103 86.0765C64.2913 86.4302 60.1659 86.5359 56.3253 86.5359C54.6392 86.5359 52.9578 86.5359 51.2718 86.5359C47.3853 86.9126 42.6259 87.3674 38.4085 86.9953C36.9017 86.2648 31.9401 86.3567 35.6521 87.4547C32.96 86.8942 30.4563 87.225 27.8423 87.4547C24.383 87.7579 20.7537 87.4547 17.276 87.4547C16.5088 87.4547 15.7462 87.4547 14.979 87.4547C12.0572 87.7671 8.5703 87.9141 5.33151 87.9141C4.7205 87.9141 4.1049 87.9187 3.4939 87.9141C2.71751 88.0197 1.37146 88.7824 0.278076 88.3735C0.654787 91.208 5.42339 89.1039 7.62853 89.7517C8.90107 89.7517 10.339 90.1192 11.3038 90.2111C13.8902 89.9814 17.0876 90.1284 19.573 90.6705C32.0734 93.3948 43.4803 96.753 54.947 102.615C61.6543 106.042 69.4504 113.847 72.8638 120.532C73.9801 122.714 76.0015 127.106 77.3154 128.943C78.6339 130.776 79.7962 137.272 82.0518 137.07C83.9354 136.487 82.6031 131.488 83.1222 129.871C83.6414 128.254 83.5725 124.014 83.8894 122.369C84.1054 119.659 84.3488 116.953 84.3488 114.1C84.3488 107.944 84.5188 101.002 85.7271 95.2645C86.9077 92.9491 85.6076 90.1835 86.1865 87.9141C90.7621 88.0014 95.4756 87.3398 99.9685 87.4547C103.028 87.1974 106.694 86.9953 110.075 86.9953C110.994 86.9953 111.913 86.9953 112.832 86.9953C115.584 86.7288 118.969 86.6967 122.02 86.5359C123.012 86.4853 123.908 86.1729 124.776 86.0765C127.606 85.7641 130.657 86.0765 133.505 86.0765C134.116 86.0765 134.732 86.0765 135.343 86.0765C137.084 85.8376 139.257 85.4884 141.315 85.6171C142.665 85.4884 143.869 85.3644 145.449 85.6171C146.299 85.6079 148.109 84.464 149.125 85.6171C148.431 89.1912 148.252 92.9032 148.206 96.6427C147.388 98.3839 142.174 97.1802 139.937 98.021C137.699 98.8617 133.928 98.7376 131.245 99.4313C128.566 100.12 126.439 99.6564 122.939 100.318C119.438 100.98 120.146 102.794 123.858 103.074C126.963 103.309 130.776 103.865 133.505 105.371C134.938 106.162 137.414 107.815 138.558 108.587C141.186 110.365 143.327 113.149 144.531 115.938C145.468 118.115 146.529 120.862 146.929 123.187C147.328 125.512 149.4 129.848 150.043 125.126C150.048 124.703 149.653 123.104 149.584 122.369C149.506 122.02 149.175 121.579 149.125 120.991C148.918 118.602 149.051 116.039 149.125 113.641C149.207 110.875 149.35 108.688 149.125 105.831C148.913 103.157 148.192 99.1786 150.962 98.4804C157.582 97.7775 166.237 96.4084 173.932 94.8051C173.597 90.868 167.129 93.8634 164.285 94.3457C162.806 94.7638 161.432 95.0532 159.691 95.2645C156.636 95.9307 153.103 95.4345 150.503 97.1021C148.651 96.1696 149.805 91.6398 150.962 90.2111C150.962 90.2111 150.926 89.9768 150.962 89.7517C151.256 87.9462 152.359 86.4578 152.8 84.6983C153.87 84.6983 154.945 84.6983 156.016 84.6983C158.395 84.6523 160.656 84.418 162.907 84.2389C168.727 83.1133 174.268 83.66 180.364 83.3201C181.958 83.0214 183.566 82.2175 185.418 81.4824C186.952 80.8714 189.52 80.3615 191.39 80.5636C191.39 80.5636 191.619 80.5407 191.849 80.5636C192.837 79.8332 194.739 80.164 195.524 80.1042C203.467 78.7076 212.706 78.3861 220.792 75.5102C222.138 75.0324 223.323 74.7752 224.926 74.5914C227.981 74.2422 230.067 73.3924 233.163 73.181C236.26 72.9651 237.358 69.7171 234.123 70.466C230.894 71.2194 229.704 71.2515 226.764 72.2944C225.427 72.7676 224.191 72.9605 222.629 73.2132C213.887 74.6327 201.814 76.3004 191.39 78.726C190.558 78.919 189.309 79.5254 188.174 79.1854C189.598 77.6694 190.765 75.8593 192.309 74.5914C193.82 72.2484 194.486 70.7232 195.065 68.1598C195.736 65.1782 196.232 62.0819 196.443 58.9717C196.742 54.566 195.318 50.2017 193.227 46.5678C190.517 42.7685 187.048 38.6707 183.121 36.0015C179.372 33.9802 174.539 32.5376 170.257 33.2451C165.976 33.9526 160.541 33.4932 157.431 37.4165C154.325 41.3444 163.311 36.902 165.663 36.0015C170.078 34.3109 175.917 34.7198 179.905 36.9203C180.791 37.2695 181.843 37.4946 182.661 37.8391C185.679 39.1117 189.093 42.6996 190.471 45.649C192.001 48.9245 193.214 52.269 194.146 55.7559C195.047 59.1325 194.987 64.3054 193.687 67.7004C193.195 68.9867 192.07 70.8427 191.39 72.2944C189.469 76.4014 185.813 79.9297 181.283 80.1042C178.595 80.2099 177.383 81.3262 174.392 81.023C171.061 80.6877 171.135 76.3279 172.095 74.132C172.095 74.132 172.09 73.9023 172.095 73.6726C172.122 72.2806 173.06 71.4031 173.014 69.9974C171.511 69.6758 170.804 71.4858 169.338 71.3756C169.233 71.5042 169.031 71.7523 168.879 71.835C168.525 72.0233 167.845 71.9544 167.501 72.2944C168.521 67.7233 162.539 66.0235 162.907 71.3756C162.907 71.3756 162.815 71.6512 162.907 71.835C163.472 72.4368 164.381 73.1535 165.204 73.2132C165.424 76.5622 160.224 84.3859 157.853 78.726C157.729 78.3355 157.421 77.2605 157.394 76.8884C157.311 75.8226 158.055 74.0631 158.313 73.2132C158.313 72.9835 158.23 72.4873 158.313 72.2944C158.033 71.2883 157.605 71.2975 156.475 71.3756C156.562 73.3143 156.452 75.5424 155.097 76.8884C155.097 76.8884 155.175 77.1503 155.097 77.3478C154.238 79.5346 152.804 82.879 150.503 83.3201C151.008 79.8102 151.284 76.2498 151.881 72.7538C150.498 72.5654 148.95 72.3633 147.287 72.2944C147.287 72.2944 147.057 72.2714 146.828 72.2944C145.22 73.5853 144.113 74.9819 142.693 76.429C142.693 76.429 142.679 76.6587 142.693 76.8884C142.886 79.7413 140.382 83.1639 139.032 80.5499C137.676 77.9404 141.26 73.1075 137.18 72.7538C134.571 73.1764 134.575 74.9268 133.505 76.8884C133.289 77.2881 133.408 78.2804 132.586 78.2666C132.586 76.5806 132.586 74.8992 132.586 73.2132C131.249 72.763 131.066 74.0631 131.208 75.0508C130.344 76.9435 129.697 79.5529 128.911 81.023C128.337 82.098 127.891 83.4073 126.155 82.8607C126.325 82.1532 125.498 81.7581 125.695 81.023C125.406 80.1961 125.47 80.4718 125.695 79.6448C125.897 77.9358 125.41 76.158 126.155 74.5914C125.723 74.3295 125.318 74.0631 124.776 74.132C121.671 73.6129 120.302 73.5899 118.345 75.9696C117.743 76.9527 116.856 79.2406 116.608 80.2053C116.36 81.1746 114.55 84.1929 113.751 82.8607C112.161 80.2237 115.547 77.1319 113.888 74.4536C112.23 71.7753 109.8 73.9253 108.697 75.9696C107.981 77.3019 107.213 78.6479 106.86 80.1042C105.812 77.6143 106.69 74.2147 106.4 71.3756C106.336 69.0648 106.377 65.7571 107.319 69.538C107.526 67.7417 106.974 66.1935 106.86 64.4845C106.653 61.4525 106.86 58.3331 106.86 55.2965C106.86 54.6855 106.86 54.0699 106.86 53.4589C106.653 51.929 106.06 49.7928 106.4 47.946C103.419 49.0026 105.775 54.6809 105.022 57.5935C105.114 60.2075 105.265 62.6515 105.022 65.4033C105.146 68.2654 105.849 73.645 105.022 76.8884C104.806 77.7383 103.873 79.3278 103.644 80.1042C103.318 81.216 101.622 85.5619 99.9685 83.7795C98.8292 80.8852 100.786 77.8302 99.9685 75.0508C93.7023 72.6343 87.7668 79.847 91.2399 85.6171C89.7514 86.1224 88.3273 85.3506 86.6459 85.6171C86.4437 80.8301 87.5647 76.9803 87.5647 72.2944C87.5647 69.3083 87.7622 66.5289 88.0241 63.5657C88.2997 60.4234 88.7913 56.8171 89.4023 53.9183C89.5263 52.5906 89.8617 51.2675 89.8617 49.7836C89.8617 47.0961 90.243 44.7486 90.7805 42.4332C91.465 36.3001 92.8386 30.3095 93.0775 24.0571C93.174 21.5487 94.7727 17.3636 94.4557 15.3284C93.6012 11.8921 91.318 19.5457 90.7483 21.7279C90.1741 23.9055 88.1573 28.2147 87.459 30.8424C86.7607 33.4702 84.7118 36.8193 83.7884 39.5757C82.865 42.3275 81.5419 44.891 80.2142 47.4866ZM169.798 72.7538C169.568 75.4872 169.136 78.4642 170.717 81.023C168.208 81.6892 165.558 81.8086 162.907 81.9418C164.207 79.847 166.913 77.5454 166.123 75.0508C167.248 74.3249 168.787 73.7461 169.798 72.7538ZM145.449 81.4824C142.321 81.0276 144.604 74.9681 146.828 74.132C147.448 73.8977 148.743 74.0631 149.584 74.5914C149.299 77.187 148.312 80.6647 145.449 81.4824ZM133.046 83.3201C133.289 81.6432 134.35 79.4473 134.883 77.8072C135.301 76.5255 135.963 74.6741 137.64 74.5914C137.929 77.8899 136.468 82.4242 139.937 84.2389C137.658 84.4732 135.127 83.7289 133.046 84.6983C132.779 84.3124 132.26 83.4992 133.046 83.3201ZM111.913 77.8072C112.101 80.0904 111.086 83.2925 113.291 84.6983C113.172 85.3368 112.349 85.0566 111.913 85.1577C110.342 85.8054 108.605 85.5941 106.86 85.1577C108.371 81.9327 108.991 78.2712 111.454 75.5102C112.258 75.8915 111.757 77.0905 111.913 77.8072ZM123.858 76.8884C124.119 78.2115 122.884 83.0536 120.536 83.2144C118.188 83.3752 117.968 79.1533 119.723 77.3478C120.789 76.2498 123.38 74.4857 123.858 76.8884ZM96.7527 81.4824C96.6746 81.634 96.4036 81.8224 96.2933 81.9418C93.2613 88.3965 89.8892 79.4197 94.4557 77.3478C94.6441 77.2605 94.9151 77.3478 94.9151 77.3478C95.4296 76.2131 98.2182 76.0201 98.0942 77.3846C97.9656 78.7536 97.3775 80.2834 96.7527 81.4824ZM157.853 82.8607C157.849 82.8377 157.394 82.8607 157.394 82.8607C156.255 83.2649 155 83.4211 153.719 83.3201C154.013 81.7811 155.175 80.3799 156.016 79.1854C156.967 79.9434 157.114 82.0337 158.772 81.9418C159.006 82.585 158.4 82.9296 157.853 82.8607ZM131.208 81.4824C131.272 83.6233 131.134 84.7993 130.289 82.4012C129.297 83.1914 129.701 85.1117 127.992 84.6983C128.925 83.5635 129.494 81.6019 131.208 81.4824ZM143.152 81.4824C144.498 84.3675 147.301 82.8147 149.125 81.4824C149.534 84.3078 143.258 84.2021 140.396 83.3201C141.659 83.4441 142.087 81.8086 143.152 81.4824ZM102.725 85.6171C102.785 84.1654 104.145 83.2695 104.563 81.9418C105.615 83.3246 105.334 86.614 102.725 85.6171ZM99.0497 85.6171C95.9166 86.4578 95.3102 84.4042 97.6715 82.8607C98.3469 83.5452 98.9303 84.5972 99.0497 85.6171ZM82.5112 112.722C82.3137 117.909 81.744 122.783 81.5924 127.882C81.5465 129.412 81.6246 130.946 81.5924 132.476C80.3107 131.553 79.741 129.807 79.2954 128.342C78.5879 126.375 77.6553 124.63 76.539 122.829C74.9632 120.794 73.3186 118.667 71.945 116.397C70.0706 113.31 67.5347 110.553 65.5133 109.047C64.0892 107.985 62.5456 106.538 61.3787 105.371C54.088 98.0807 43.0485 93.0732 32.8957 91.5893C30.8468 91.2907 29.0229 90.868 26.9235 90.6705C26.7627 90.6567 26.5881 90.28 26.4641 90.2111C24.5759 89.986 22.8623 89.8574 20.9512 89.7517C23.9511 87.7763 28.3981 89.3245 31.9769 88.8329C34.0993 89.0212 35.7348 88.9523 37.9491 88.8329C43.099 87.9968 49.448 88.1162 54.947 88.3735C55.728 88.4102 56.9041 88.7043 58.1629 88.8329C55.31 87.2434 59.6192 88.5527 60.9193 88.3735C64.227 88.2311 68.2973 87.5741 71.945 87.9141C74.049 88.1116 75.7167 88.0335 77.9172 87.9141C79.7594 87.6155 82.1896 87.1836 84.3488 87.4547C84.1375 95.9399 83.4806 104.609 82.5112 112.722ZM139.477 100.318C141.177 99.8769 142.932 99.1924 144.99 99.3992C145.748 99.4773 146.529 99.3394 147.287 99.3992C147.218 105.307 146.851 111.119 147.287 116.397C143.208 109.106 137.047 103.217 128.452 102.156C132.311 101.347 135.683 100.892 139.477 100.318Z" fill="#0C0C0C" fill-opacity="0.88" stroke="black" stroke-width="0.459403"/>
</svg>

`

export interface BuildCertificateOptions {
  /**
   * When true, the document is built for off-screen rendering and
   * direct PDF download: the floating print bar and the auto-print
   * script are omitted so the certificate can be captured cleanly.
   */
  forDownload?: boolean
}

export function buildCertificateHtml(
  d: CertificateData,
  options: BuildCertificateOptions = {}
): string {
  const { forDownload = false } = options
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
  .recipient-underline { width: 130mm; border-bottom: 1px solid #9ca3af; margin: 30px auto 3mm; }

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

  /* QR verification block — anchored bottom-left, clear of the footer */
  .qr-verify { position: absolute; bottom: 14mm; left: 16mm; display: flex; flex-direction: column; align-items: center; gap: 1mm; }
  .qr-verify .qr-box { width: 22mm; height: 22mm; background: #fff; padding: 1mm; border: 1px solid #d4dae6; border-radius: 2mm; }
  .qr-verify .qr-box svg { width: 100%; height: 100%; display: block; }
  .qr-verify .qr-cap { font-size: 6pt; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; font-family: 'Inter', system-ui, sans-serif; }

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
  ${
    forDownload
      ? ''
      : `<div class="print-bar no-print">
    <span>📄 Certificate ready — save as PDF from the print dialog</span>
    <button onclick="window.print()">Print / Save as PDF</button>
    <span class="hint">(Choose “Save as PDF” in the destination)</span>
  </div>`
  }

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
        ${
          d.expiryDate
            ? `<div class="meta-item">
          <div class="meta-label">Valid Until</div>
          <div class="meta-value">${escape(fmt(d.expiryDate))}</div>
        </div>`
            : ''
        }
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
          <div class="meta-label">ATP ID</div>
          <div class="meta-value">${escape(d.atpNo || '—')}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="sig-block">
        <div class="sig-image">${CEO_SIGNATURE_SVG}</div>
        <div class="sig-line"></div>
        <div class="sig-name">Jahangir Khan</div>
        <div class="sig-role">Chief Executive Officer · UKQAM</div>
      </div>

      <div class="seal">
        <div class="seal-text">UKQAM</div>
        <div class="seal-star">★</div>
        <div class="seal-text">Verified</div>
      </div>

      <div class="sig-block">
        <div class="sig-image" style="font-family:'Brush Script MT','Apple Chancery',cursive;font-size:18pt;color:#0a1f4d;align-items:center;padding-bottom:3mm;white-space:nowrap;overflow:hidden;">${d.atpName || 'Your Signature'}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escape(d.atpName || 'Training Centre')}</div>
        <div class="sig-role">Approved Training Centre</div>
      </div>
    </div>

    ${
      d.qrSvg
        ? `<div class="qr-verify">
      <div class="qr-box">${d.qrSvg}</div>
      <div class="qr-cap">Scan to verify</div>
    </div>`
        : ''
    }

    <div class="cert-id">CERTIFICATE NO: ${escape(d.certificateNo)} &nbsp;·&nbsp; ISSUED ${escape(fmt(d.issueDate))}${
      d.expiryDate ? ` &nbsp;·&nbsp; EXPIRES ${escape(fmt(d.expiryDate))}` : ''
    }</div>
  </div>

  ${
    forDownload
      ? ''
      : `<script>
    // Give the browser a beat to render fonts/images, then open the print dialog.
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>`
  }
</body>
</html>`
}

'use client'

interface Props {
  courses: any[]; invoices: any[]; candidates: any[]; atps: any[]; deposits: any[]
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: 4 }}>
        <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ color: '#6b7280' }}>{value}</span>
      </div>
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function AnalyticsClient({ courses, invoices, candidates, atps, deposits }: Props) {
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const passRate = candidates.length > 0 ? Math.round((candidates.filter(c => c.status === 'pass').length / candidates.length) * 100) : 0
  const verifiedAtps = atps.filter(a => a.kyc_verified).length

  // Revenue by month (last 6)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
  })
  const revenueByMonth = months.map(m => ({
    label: m.label,
    value: invoices.filter(i => i.status === 'paid' && new Date(i.issued_at).getMonth() === m.month && new Date(i.issued_at).getFullYear() === m.year)
      .reduce((s, i) => s + i.amount, 0),
  }))
  const maxRevenue = Math.max(...revenueByMonth.map(m => m.value), 1)

  // Courses by status
  const statusCounts = ['draft', 'submitted', 'moderation', 'approved', 'rejected'].map(s => ({
    label: s, value: courses.filter(c => c.status === s).length,
  }))
  const maxStatus = Math.max(...statusCounts.map(s => s.value), 1)

  // Candidates by country (top 5)
  const countryCounts: Record<string, number> = {}
  candidates.forEach(c => { if (c.country) countryCounts[c.country] = (countryCounts[c.country] || 0) + 1 })
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCountry = Math.max(...topCountries.map(([, v]) => v), 1)

  const statusColors: Record<string, string> = { draft: '#9ca3af', submitted: '#3b82f6', moderation: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }

  return (
    <>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatBox label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} sub="paid invoices" color="#43a047" />
        <StatBox label="Total ATPs" value={atps.length} sub={`${verifiedAtps} verified`} color="#1976d2" />
        <StatBox label="Total Courses" value={courses.length} sub={`${courses.filter(c => c.status === 'approved').length} approved`} color="#00acc1" />
        <StatBox label="Total Students" value={candidates.length} sub={`${passRate}% pass rate`} color="#7c3aed" />
        <StatBox label="Certificates" value={candidates.filter(c => c.status === 'pass').length} sub="students passed" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">Revenue — Last 6 Months</div>
          <div className="card-body">
            {revenueByMonth.map(m => (
              <Bar key={m.label} label={m.label} value={m.value} max={maxRevenue} color="#43a047" />
            ))}
            <div style={{ marginTop: 12, fontSize: '0.775rem', color: '#6b7280', textAlign: 'right' }}>
              Total: <strong style={{ color: '#43a047' }}>${totalRevenue.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Course Status */}
        <div className="card">
          <div className="card-header">Courses by Status</div>
          <div className="card-body">
            {statusCounts.map(s => (
              <Bar key={s.label} label={s.label} value={s.value} max={maxStatus} color={statusColors[s.label]} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Students by country */}
        <div className="card">
          <div className="card-header">Top Student Countries</div>
          <div className="card-body">
            {topCountries.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '0.825rem', textAlign: 'center', padding: 20 }}>No data yet.</div>
            ) : topCountries.map(([country, count]) => (
              <Bar key={country} label={country} value={count} max={maxCountry} color="#7c3aed" />
            ))}
          </div>
        </div>

        {/* ATP breakdown */}
        <div className="card">
          <div className="card-header">ATP & Payment Breakdown</div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>ATP Verification</div>
              <Bar label="Verified" value={verifiedAtps} max={Math.max(atps.length, 1)} color="#43a047" />
              <Bar label="Unverified" value={atps.length - verifiedAtps} max={Math.max(atps.length, 1)} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Payment Methods</div>
              {['deposit', 'stripe'].map(m => {
                const count = invoices.filter(i => i.payment_method === m && i.status === 'paid').length
                return <Bar key={m} label={m === 'deposit' ? 'Account Balance' : 'Stripe'} value={count} max={Math.max(invoices.filter(i => i.status === 'paid').length, 1)} color="#1976d2" />
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

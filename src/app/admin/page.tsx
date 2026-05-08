import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [
    { count: atpCount },
    { count: pendingAtpCount },
    { count: courseCount },
    { count: pendingDepositCount },
    { data: recentDeposits },
    { data: revenueData },
    { count: openTickets },
    { count: totalCandidates },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false).eq('kyc_verified', false),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('deposits').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('amount').eq('status', 'paid'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
  ])

  const totalRevenue = (revenueData ?? []).reduce((s: number, i: any) => s + (i.amount ?? 0), 0)
  const displayName = profile?.full_name || user.email || 'Admin'

  const stats = [
    { label: 'Total ATPs', value: atpCount ?? 0, sub: `${pendingAtpCount ?? 0} unverified`, href: '/admin/atps', color: '#1976d2' },
    { label: 'Total Courses', value: courseCount ?? 0, sub: 'all time', href: '/admin/courses', color: '#00acc1' },
    { label: 'Total Students', value: totalCandidates ?? 0, sub: 'enrolled', href: '/admin/analytics', color: '#7c3aed' },
    { label: 'Pending Deposits', value: pendingDepositCount ?? 0, sub: 'awaiting approval', href: '/admin/deposits', color: '#f59e0b' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}`, sub: 'paid invoices', href: '/admin/finance', color: '#43a047' },
    { label: 'Open Tickets', value: openTickets ?? 0, sub: 'need response', href: '/admin/support', color: '#e53935' },
  ]

  return (
    <AdminLayout userName={displayName}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>Platform-wide summary</div>
        </div>
      </div>

      {/* Stat Cards — plain links, no hover handlers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} style={{
            display: 'block', textDecoration: 'none',
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: 18, borderLeft: `4px solid ${s.color}`,
          }}>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.sub}</div>
          </Link>
        ))}
      </div>

      {/* Pending deposits alert */}
      {(pendingDepositCount ?? 0) > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e' }}>⚠ {pendingDepositCount} deposit{pendingDepositCount !== 1 ? 's' : ''} awaiting approval</div>
            <div style={{ fontSize: '0.775rem', color: '#b45309', marginTop: 2 }}>ATPs are waiting for their balance to be topped up.</div>
          </div>
          <Link href="/admin/deposits" style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            Review Deposits →
          </Link>
        </div>
      )}

      {/* Recent pending deposits */}
      {recentDeposits && recentDeposits.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Recent Pending Deposits</span>
            <Link href="/admin/deposits" style={{ fontSize: '0.775rem', color: '#26c6da' }}>View all →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th></th></tr>
              </thead>
              <tbody>
                {recentDeposits.map((d: any) => (
                  <tr key={d.id}>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: '#43a047' }}>${d.amount.toFixed(2)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{d.payment_method?.replace('_', ' ') ?? '—'}</td>
                    <td style={{ fontSize: '0.775rem', color: '#6b7280' }}>{d.reference ?? '—'}</td>
                    <td><Link href="/admin/deposits" style={{ color: '#1976d2', fontSize: '0.8rem', fontWeight: 600 }}>Approve →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

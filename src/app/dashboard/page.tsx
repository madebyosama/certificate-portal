import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { getCachedProfile, getCachedDashboardStats } from '@/lib/data'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, stats] = await Promise.all([
    getCachedProfile(user.id),
    getCachedDashboardStats(user.id),
  ])

  const displayName = profile?.atc_name || profile?.full_name || user.email || 'User'

  const statCards = [
    { label: 'Total Courses', value: stats.courseReferenceNumbers, href: '/courses' },
    { label: 'Pending Review', value: stats.uploadedResults, href: '/courses?filter=submitted' },
    { label: 'Trainers', value: stats.totalTrainers, href: '/trainers' },
    { label: 'Invoices', value: stats.allInvoices, href: '/invoices' },
  ]

  return (
    <AppLayout userName={displayName}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>Welcome back, {displayName}</div>
        </div>
        <Link href="/courses/create" className="btn btn-primary">+ Register Course</Link>
      </div>

      {profile?.kyc_verified && (
        <div className="kyc-banner">
          <div style={{ width: 36, height: 36, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065f46', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
          </div>
          <div>
            <div className="kyc-title">Account Verified</div>
            <div className="kyc-text">Your ATP account has been verified and approved.</div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-value">{card.value}</div>
            <Link href={card.href} className="stat-card-action">View All</Link>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">Account Balance</div>
          <div className="balance-row">
            <div>
              <div className="balance-label">Available Balance</div>
              <div className="balance-amount">${(profile?.deposit_balance ?? 0).toFixed(2)}</div>
            </div>
            <Link href="/deposit" className="btn btn-primary btn-sm">Add Funds</Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Quick Actions</div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/courses/create" className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }}>+ Register New Course</Link>
            <Link href="/trainers" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>Manage Trainers</Link>
            <Link href="/deposit" className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>Add Funds to Wallet</Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

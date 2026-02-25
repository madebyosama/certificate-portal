import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { getCachedProfile, getCachedDashboardStats } from '@/lib/data'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, stats] = await Promise.all([
    getCachedProfile(user.id),
    getCachedDashboardStats(user.id),
  ])

  const displayName =
    profile?.atc_name || profile?.full_name || user.email || 'User'

  const statCards = [
    {
      label: 'Course Reference Numbers',
      value: stats.courseReferenceNumbers,
      href: '/courses',
    },
    {
      label: 'Uploaded Results',
      value: stats.uploadedResults,
      href: '/courses?filter=submitted',
    },
    { label: 'All Invoices', value: stats.allInvoices, href: '/invoices' },
    {
      label: 'Other Invoices',
      value: stats.otherInvoices,
      href: '/other-invoices',
    },
    { label: 'Total Trainers', value: stats.totalTrainers, href: '/trainers' },
    {
      label: 'ATC Upload Documents',
      value: stats.atcUploadDocuments,
      href: '/deposit',
    },
  ]

  return (
    <AppLayout userName={displayName}>
      <div className='page-header'>
        <h1 className='page-title'>
          Dashboard{' '}
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 400,
              color: 'var(--gray-500)',
            }}
          >
            Trainer and Course
          </span>
        </h1>
      </div>

      {profile?.kyc_verified && (
        <div className='kyc-banner'>
          <div className='kyc-icon'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
              <circle cx='12' cy='7' r='4' />
              <path
                d='M9 11l3 3L22 4'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <div>
            <div className='kyc-title'>ATP Verified</div>
            <div className='kyc-text'>
              Your submitted ATP information has been verified and approved by
              the admin. <a href='#'>Click here</a> to view your approved
              details.
            </div>
          </div>
        </div>
      )}

      <h2
        className='section-title'
        style={{ fontSize: '1rem', marginTop: 0, marginBottom: 16 }}
      >
        Account Information
      </h2>

      <div className='stats-grid'>
        {statCards.map((card) => (
          <div key={card.label} className='stat-card'>
            <div className='stat-card-label'>{card.label}</div>
            <div className='stat-card-value'>{card.value}</div>
            <Link href={card.href} className='stat-card-action'>
              View All
            </Link>
          </div>
        ))}
      </div>

      {/* Deposit Balance */}
      <div className='card' style={{ marginTop: 24 }}>
        <div className='card-header'>Account Balance</div>
        <div className='card-body'>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--gray-500)',
                  marginBottom: 4,
                }}
              >
                Available Deposit Balance
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--blue-600)',
                }}
              >
                ${(profile?.deposit_balance ?? 0).toFixed(4)}
              </div>
            </div>
            <Link
              href='/deposit'
              className='btn btn-primary btn-sm'
              style={{ marginLeft: 'auto' }}
            >
              Add Deposit
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const IC = {
  dashboard: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' />
    </svg>
  ),
  atps: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
    </svg>
  ),
  courses: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z' />
    </svg>
  ),
  deposits: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' />
    </svg>
  ),
  finance: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' />
    </svg>
  ),
  analytics: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' />
    </svg>
  ),
  announce: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z' />
    </svg>
  ),
  support: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' />
    </svg>
  ),
  logout: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z' />
    </svg>
  ),
}

const nav = [
  { label: 'Overview', icon: IC.dashboard, href: '/admin' },
  { label: 'ATPs', icon: IC.atps, href: '/admin/atps' },
  { label: 'Course Types', icon: IC.courses, href: '/admin/courses' },
  { label: 'Deposits', icon: IC.deposits, href: '/admin/deposits' },
  { label: 'Finance', icon: IC.finance, href: '/admin/finance' },
  { label: 'Analytics', icon: IC.analytics, href: '/admin/analytics' },
  { label: 'Announcements', icon: IC.announce, href: '/admin/announcements' },
  { label: 'Support', icon: IC.support, href: '/admin/support' },
]

interface Props {
  children: React.ReactNode
  userName?: string
}

export default function AdminLayout({ children, userName = 'Admin' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [showMenu, setShowMenu] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className='app-shell'>
      {/* Admin Sidebar */}
      <aside
        style={{
          width: 220,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #2B328C 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            padding: '18px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <img
            src='/logo.png'
            alt='ISTS'
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              objectFit: 'contain',
            }}
          />
          <div>
            <div
              style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}
            >
              UKQAM<span style={{ color: '#9DA4FF' }}> Admin</span>
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.65rem',
                marginTop: 1,
              }}
            >
              Control Panel
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <div
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  cursor: 'pointer',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderLeft: `3px solid ${active ? '#9DA4FF' : 'transparent'}`,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {item.icon}
                {item.label}
              </div>
            )
          })}
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.07)',
              margin: '4px 0',
            }}
          />
          <div
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')
            }
          >
            {IC.logout} Logout
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div
        style={{
          flex: 1,
          marginLeft: 220,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <header
          style={{
            height: 56,
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              fontSize: '0.775rem',
              fontWeight: 600,
              color: '#2B328C',
              background: '#9DA4FF',
              padding: '3px 10px',
              borderRadius: 20,
            }}
          >
            Admin Panel
          </div>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowMenu(!showMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '5px 8px',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9DA4FF, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {initials}
              </div>
              <span
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                {userName}
              </span>
            </div>
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: 140,
                  zIndex: 300,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={logout}
                  style={{
                    padding: '9px 14px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: '#e53935',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#f9fafb')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </header>
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </div>
  )
}

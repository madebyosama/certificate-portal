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
  courses: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z' />
    </svg>
  ),
  trainers: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
    </svg>
  ),
  wallet: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' />
    </svg>
  ),
  invoice: (
    <svg viewBox='0 0 24 24' fill='currentColor' width='16' height='16'>
      <path d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' />
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
  { label: 'Dashboard', icon: IC.dashboard, href: '/dashboard' },
  {
    label: 'Courses',
    icon: IC.courses,
    children: [
      { label: 'Register Course', href: '/courses/create' },
      { label: 'All Courses', href: '/courses' },
    ],
  },
  { label: 'Trainers', icon: IC.trainers, href: '/trainers' },
  { label: 'Wallet', icon: IC.wallet, href: '/deposit' },
  { label: 'Invoices', icon: IC.invoice, href: '/invoices' },
  { label: 'Support', icon: IC.support, href: '/support' },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [open, setOpen] = useState<string[]>(['Courses'])

  function toggle(label: string) {
    setOpen((p) =>
      p.includes(label) ? p.filter((l) => l !== label) : [...p, label]
    )
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className='sidebar'>
      <div className='sidebar-logo'>
        <img className='sidebar-logo-img' src='/logo.png' alt='ISTS' />
        <span className='sidebar-logo-text'>
          ISTS<span> Portal</span>
        </span>
      </div>
      <nav className='sidebar-nav'>
        {nav.map((item) => {
          const isOpen = open.includes(item.label)
          const isActive = item.href ? pathname === item.href : false
          if (item.children) {
            return (
              <div key={item.label}>
                <div
                  className={`nav-item ${isOpen ? 'active' : ''}`}
                  onClick={() => toggle(item.label)}
                >
                  <span>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
                {isOpen &&
                  item.children.map((c) => (
                    <div
                      key={c.href}
                      className={`nav-subitem ${pathname === c.href ? 'active' : ''}`}
                      onClick={() => router.push(c.href)}
                    >
                      {c.label}
                    </div>
                  ))}
              </div>
            )
          }
          return (
            <div
              key={item.label}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => item.href && router.push(item.href)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          )
        })}
        <div className='nav-divider' />
        <div className='nav-item' onClick={logout}>
          <span>{IC.logout}</span>
          <span>Logout</span>
        </div>
      </nav>
    </aside>
  )
}

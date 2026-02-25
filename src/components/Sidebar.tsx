'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavItem {
  label: string
  icon: string
  href?: string
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '📋', href: '/dashboard' },
  {
    label: 'Course Reference Numbers',
    icon: '#',
    children: [
      { label: 'New Course Reference Number', href: '/courses/create' },
      { label: 'Course Reference Numbers', href: '/courses' },
      { label: 'Result Uploaded', href: '/courses?filter=submitted' },
      { label: 'Moderation Paper Upload', href: '/courses?filter=moderation' },
      { label: 'Moderation Paper Review', href: '/courses?filter=approved' },
    ],
  },
  { label: 'Invoice', icon: '₪', href: '/invoices' },
  { label: 'Other Invoice', icon: '📄', href: '/other-invoices' },
  { label: 'Transactions', icon: '⊞', href: '/transactions' },
  { label: 'Trainers', icon: '👥', href: '/trainers' },
  { label: 'Deposit', icon: '⚙', href: '/deposit' },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([
    'Course Reference Numbers',
  ])

  function toggleMenu(label: string) {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  function navigate(href: string) {
    router.push(href)
  }

  return (
    <aside className='sidebar'>
      <div className='sidebar-logo'>
        <div className='sidebar-logo-oval'>ISTS</div>
        <span className='sidebar-logo-text'>
          ISTS<span> Portal</span>
        </span>
      </div>

      <nav className='sidebar-nav'>
        {navItems.map((item) => {
          const isOpen = openMenus.includes(item.label)
          const isActive = item.href ? pathname === item.href : false

          if (item.children) {
            return (
              <div key={item.label}>
                <div
                  className={`nav-item ${isOpen ? 'active' : ''}`}
                  onClick={() => toggleMenu(item.label)}
                >
                  <span>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
                {isOpen && (
                  <div className='nav-submenu'>
                    {item.children.map((child) => (
                      <div
                        key={child.href}
                        className={`nav-subitem ${pathname === child.href ? 'active' : ''}`}
                        onClick={() => navigate(child.href)}
                      >
                        {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div
              key={item.label}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => item.href && navigate(item.href)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          )
        })}

        <div className='nav-divider' />

        <div className='nav-item' onClick={() => navigate('/logout')}>
          <span>⏻</span>
          <span>Logout</span>
        </div>
      </nav>
    </aside>
  )
}

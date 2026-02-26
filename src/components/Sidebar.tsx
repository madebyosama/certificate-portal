'use client'
import { useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface NavItem {
  label: string
  icon: ReactNode
  href?: string
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='200'
        height='200'
        viewBox='0 0 256 256'
      >
        <path
          fill='#fff'
          d='M24.75 115.54a102.31 102.31 0 0 1 23.31-53.76a16 16 0 0 1 23.63-1.1l27.67 28.26a15.87 15.87 0 0 1 1.69 20.48a25.59 25.59 0 0 0-3.7 7.75a4 4 0 0 1-3.82 2.83h-64.8a4 4 0 0 1-3.98-4.46Zm112.64-91.48A16 16 0 0 0 120 40v40.67a15.86 15.86 0 0 0 13.25 15.76a32 32 0 0 1 5.41 61.76A4.06 4.06 0 0 0 136 162v65.23a4 4 0 0 0 4.46 4A104.34 104.34 0 0 0 232 129.48c.75-54.29-40.81-100.6-94.61-105.42Zm-20.14 134.1a32 32 0 0 1-19.4-19.42a4.06 4.06 0 0 0-3.8-2.74H28.72a4 4 0 0 0-4 4.45a104.1 104.1 0 0 0 90.82 90.82a4 4 0 0 0 4.45-4V162a4.05 4.05 0 0 0-2.74-3.84Z'
        />
      </svg>
    ),
    href: '/dashboard',
  },
  {
    label: 'Course Reference Numbers',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='200'
        height='200'
        viewBox='0 0 256 256'
      >
        <path
          fill='#fff'
          d='M176 207.24a119 119 0 0 0 16-7.73V240a8 8 0 0 1-16 0Zm11.76-88.43l-56-29.87a8 8 0 0 0-7.52 14.12L171 128l17-9.06Zm64-29.87l-120-64a8 8 0 0 0-7.52 0l-120 64a8 8 0 0 0 0 14.12L32 117.87v48.42a15.91 15.91 0 0 0 4.06 10.65C49.16 191.53 78.51 216 128 216a130 130 0 0 0 48-8.76v-76.57l-5-2.67l-43 22.93L43.83 106L25 96l103-54.93L231 96l-18.78 10h-.06L188 118.94a8 8 0 0 1 4 6.93v73.64a115.63 115.63 0 0 0 27.94-22.57a15.91 15.91 0 0 0 4.06-10.65v-48.42l27.76-14.81a8 8 0 0 0 0-14.12Z'
        />
      </svg>
    ),
    children: [
      { label: 'New Course Reference Number', href: '/courses/create' },
      { label: 'Course Reference Numbers', href: '/courses' },
      { label: 'Result Uploaded', href: '/courses?filter=submitted' },
      { label: 'Moderation Paper Upload', href: '/courses?filter=moderation' },
      { label: 'Moderation Paper Review', href: '/courses?filter=approved' },
    ],
  },
  {
    label: 'Invoice',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='200'
        height='200'
        viewBox='0 0 256 256'
      >
        <path
          fill='#fff'
          d='M28 128a8 8 0 0 1 0-16h28a8 8 0 0 0 0-16H40a24 24 0 0 1 0-48a8 8 0 0 1 16 0h8a8 8 0 0 1 0 16H40a8 8 0 0 0 0 16h16a24 24 0 0 1 0 48a8 8 0 0 1-16 0Zm196-80H96a8 8 0 0 0 0 16h120v32H104a8 8 0 0 0 0 16h56v32H80a8 8 0 0 0 0 16h80v32H40v-40a8 8 0 0 0-16 0v40a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a8 8 0 0 0-8-8'
        />
      </svg>
    ),
    href: '/invoices',
  },
  {
    label: 'Other Invoice',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='200'
        height='200'
        viewBox='0 0 256 256'
      >
        <path
          fill='#fff'
          d='M72 104h32v48H72Zm160-48v160a8 8 0 0 1-11.58 7.15L192 208.94l-28.42 14.21a8 8 0 0 1-7.16 0L128 208.94l-28.42 14.21a8 8 0 0 1-7.16 0L64 208.94l-28.42 14.21A8 8 0 0 1 24 216V56a16 16 0 0 1 16-16h176a16 16 0 0 1 16 16ZM120 96a8 8 0 0 0-8-8H64a8 8 0 0 0-8 8v64a8 8 0 0 0 8 8h48a8 8 0 0 0 8-8Zm80 48a8 8 0 0 0-8-8h-48a8 8 0 0 0 0 16h48a8 8 0 0 0 8-8Zm0-32a8 8 0 0 0-8-8h-48a8 8 0 0 0 0 16h48a8 8 0 0 0 8-8Z'
        />
      </svg>
    ),
    href: '/other-invoices',
  },
  {
    label: 'Transactions',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='200'
        height='200'
        viewBox='0 0 256 256'
      >
        <path
          fill='#fff'
          d='M116 80h4v40h-4a20 20 0 0 1 0-40Zm32 56h-12v40h12a20 20 0 0 0 0-40Zm84-8A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104Zm-48 28a36 36 0 0 0-36-36h-12V80h4a20 20 0 0 1 20 20a8 8 0 0 0 16 0a36 36 0 0 0-36-36h-4v-8a8 8 0 0 0-16 0v8h-4a36 36 0 0 0 0 72h4v40h-8a20 20 0 0 1-20-20a8 8 0 0 0-16 0a36 36 0 0 0 36 36h8v8a8 8 0 0 0 16 0v-8h12a36 36 0 0 0 36-36Z'
        />
      </svg>
    ),
    href: '/transactions',
  },
  {
    label: 'Trainers',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='200'
        height='200'
        viewBox='0 0 256 256'
      >
        <path
          fill='#fff'
          d='M64.12 147.8a4 4 0 0 1-4 4.2H16a8 8 0 0 1-7.8-6.17a8.35 8.35 0 0 1 1.62-6.93A67.79 67.79 0 0 1 37 117.51a40 40 0 1 1 66.46-35.8a3.94 3.94 0 0 1-2.27 4.18A64.08 64.08 0 0 0 64 144c0 1.28 0 2.54.12 3.8Zm182-8.91A67.76 67.76 0 0 0 219 117.51a40 40 0 1 0-66.46-35.8a3.94 3.94 0 0 0 2.27 4.18A64.08 64.08 0 0 1 192 144c0 1.28 0 2.54-.12 3.8a4 4 0 0 0 4 4.2H240a8 8 0 0 0 7.8-6.17a8.33 8.33 0 0 0-1.63-6.94Zm-89 43.18a48 48 0 1 0-58.37 0A72.13 72.13 0 0 0 65.07 212A8 8 0 0 0 72 224h112a8 8 0 0 0 6.93-12a72.15 72.15 0 0 0-33.74-29.93Z'
        />
      </svg>
    ),
    href: '/trainers',
  },
  {
    label: 'Deposit',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='200'
        height='200'
        viewBox='0 0 256 256'
      >
        <path
          fill='#fff'
          d='M232 198.65V240a8 8 0 0 1-16 0v-41.35A74.84 74.84 0 0 0 192 144v58.35a8 8 0 0 1-14.69 4.38l-10.68-16.31c-.08-.12-.16-.25-.23-.38a12 12 0 0 0-20.89 11.83l22.13 33.79a8 8 0 0 1-13.39 8.76l-22.26-34l-.24-.38c-.38-.66-.73-1.33-1.05-2H56a8 8 0 0 1-8-8V96a16 16 0 0 1 16-16h48v48a8 8 0 0 0 16 0V80h48a16 16 0 0 1 16 16v27.62a90.89 90.89 0 0 1 40 75.03M128 35.31l18.34 18.35a8 8 0 0 0 11.32-11.32l-32-32a8 8 0 0 0-11.32 0l-32 32a8 8 0 0 0 11.32 11.32L112 35.31V80h16Z'
        />
      </svg>
    ),
    href: '/deposit',
  },
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
        <div className='sidebar-logo-oval'>
          <img src='/logo.png' alt='ISTS Logo' />
        </div>
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

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  userName?: string
}

export default function Header({ userName = 'User' }: HeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="header">
      <button className="header-bell" title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      <div className="header-user" onClick={() => setShowMenu(!showMenu)} style={{ position: 'relative' }}>
        <div className="header-avatar">{initials}</div>
        <span className="header-username">{userName}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--gray-500)' }}>▼</span>

        {showMenu && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '160px',
            zIndex: 300,
            overflow: 'hidden',
          }}>
            <div
              onClick={() => router.push('/dashboard')}
              style={{ padding: '10px 14px', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--gray-700)' }}
              className="action-dropdown-item"
            >
              Profile
            </div>
            <div
              onClick={handleLogout}
              style={{ padding: '10px 14px', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--red-500)' }}
              className="action-dropdown-item"
            >
              Logout
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

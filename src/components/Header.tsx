'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header({ userName = 'User' }: { userName?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [show, setShow] = useState(false)
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="header">
      <div className="header-user" onClick={() => setShow(!show)}>
        <div className="header-avatar">{initials}</div>
        <span className="header-username">{userName}</span>
        <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>▼</span>
        {show && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 140, zIndex: 300, overflow: 'hidden' }}>
            <div onClick={logout} style={{ padding: '9px 14px', fontSize: '0.8rem', cursor: 'pointer', color: '#e53935' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Logout
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'forgot'

export default function LoginPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Let the server decide where to redirect based on is_admin
    // This avoids RLS issues with client-side profile reads right after login
    window.location.href = '/auth/role-check'
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo,
      }
    )

    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setInfo(
      `If an account exists for ${email}, a password reset link has been sent. Please check your inbox.`
    )
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setInfo('')
    setPassword('')
  }

  return (
    <div className='login-page'>
      <div className='login-card'>
        <div className='login-logo'>
          <img src='/login-logo.png' alt='UKQAM Logo' />
          <div className='login-tagline'>Training Portal</div>
          <div className='login-subtext'>
            {mode === 'login'
              ? 'Sign in to your account to continue.'
              : 'Enter your email and we\u2019ll send you a reset link.'}
          </div>
        </div>

        {error && <div className='alert alert-error'>{error}</div>}
        {info && <div className='alert alert-info'>{info}</div>}

        {mode === 'login' ? (
          <form className='login-form' onSubmit={handleLogin}>
            <div className='form-group'>
              <label className='form-label'>Email address</label>
              <input
                className='form-input'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className='form-group'>
              <label className='form-label'>Password</label>
              <input
                className='form-input'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className='login-btn' type='submit' disabled={loading}>
              {loading ? (
                <>
                  <span className='spinner' /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        ) : (
          <form className='login-form' onSubmit={handleForgot}>
            <div className='form-group'>
              <label className='form-label'>Email address</label>
              <input
                className='form-input'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button className='login-btn' type='submit' disabled={loading}>
              {loading ? (
                <>
                  <span className='spinner' /> Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        <div className='login-forgot'>
          {mode === 'login' ? (
            <button
              type='button'
              onClick={() => switchMode('forgot')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                font: 'inherit',
                padding: 0,
              }}
            >
              Forgot your password?
            </button>
          ) : (
            <button
              type='button'
              onClick={() => switchMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                font: 'inherit',
                padding: 0,
              }}
            >
              ← Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

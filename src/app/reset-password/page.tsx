'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setInfo('Password updated. Redirecting...')
    setTimeout(() => {
      router.push('/auth/role-check')
    }, 800)
  }

  return (
    <div className='login-page'>
      <div className='login-card'>
        <div className='login-logo'>
          <img src='/logo.png' alt='UKQAM Logo' />
          <div className='login-tagline'>Set a new password</div>
          <div className='login-subtext'>
            Enter and confirm your new password below.
          </div>
        </div>

        {error && <div className='alert alert-error'>{error}</div>}
        {info && <div className='alert alert-info'>{info}</div>}

        <form className='login-form' onSubmit={handleSubmit}>
          <div className='form-group'>
            <label className='form-label'>New password</label>
            <input
              className='form-input'
              type='password'
              placeholder='At least 8 characters'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className='form-group'>
            <label className='form-label'>Confirm password</label>
            <input
              className='form-input'
              type='password'
              placeholder='Repeat password'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button className='login-btn' type='submit' disabled={loading}>
            {loading ? (
              <>
                <span className='spinner' /> Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

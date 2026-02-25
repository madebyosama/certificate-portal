'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function generateCaptcha(): number {
  return Math.floor(100 + Math.random() * 900)
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaValue] = useState(generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (Number(captchaInput) !== captchaValue) {
      setError('Captcha verification failed. Please try again.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className='login-page'>
      <h1 className='login-title'>Portal Login</h1>

      <div className='login-card'>
        <div className='login-logo'>
          <div className='login-logo-badge'>ISTS</div>
          <div className='login-tagline'>
            Login to the ISTS course provider secure Area
          </div>
          <div className='login-subtext'>
            Access to the ISTS secure area is available to registered users
            only. Enter your email address and password to log in.
          </div>
        </div>

        {error && <div className='alert alert-error'>{error}</div>}

        <form className='login-form' onSubmit={handleLogin}>
          <div className='form-group'>
            <input
              className='form-input'
              type='email'
              placeholder='Email address'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className='form-group'>
            <input
              className='form-input'
              type='password'
              placeholder='••••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className='form-group'>
            <label className='form-label'>
              Captcha <span className='required'>*</span>
            </label>
            <div className='captcha-row'>
              <div className='captcha-box'>{captchaValue}</div>
              <input
                className='form-input'
                type='number'
                placeholder='Enter captcha'
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
              />
            </div>
          </div>

          <button className='login-btn' type='submit' disabled={loading}>
            {loading ? <span className='spinner' /> : 'Sign me in'}
          </button>
        </form>

        <div className='login-forgot'>Forgot your password?</div>
      </div>
    </div>
  )
}

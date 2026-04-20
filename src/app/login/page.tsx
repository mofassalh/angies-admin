'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  const handleForgot = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Reset link sent! Please check your email.')
    }
    setLoading(false)
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#111111' }}>
      <div className="p-8 rounded-2xl shadow-xl w-full max-w-md" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2a2a2a' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#F5C800' }}>Angie's</h1>
          <p className="mt-1 text-sm" style={{ color: '#888' }}>
            {mode === 'login' ? 'Admin Panel' : 'Reset Password'}
          </p>
        </div>

        {mode === 'forgot' && (
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3" style={{ background: '#2a2a2a' }}>
              🔑
            </div>
            <p className="text-sm" style={{ color: '#888' }}>Enter your email and we'll send you a reset link</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#2a0000', color: '#ff4444', border: '1px solid #440000' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#002a00', color: '#44ff44', border: '1px solid #004400' }}>
            {success}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none text-white"
            style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
          />

          {mode === 'login' && (
            <>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-xl outline-none text-white"
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
              />
              <div className="text-right">
                <button
                  onClick={() => switchMode('forgot')}
                  className="text-xs hover:underline"
                  style={{ color: '#F5C800' }}
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          <button
            onClick={mode === 'login' ? handleLogin : handleForgot}
            disabled={loading || !email || (mode === 'login' && !password)}
            className="w-full font-bold py-3 rounded-xl transition disabled:opacity-50"
            style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Send Reset Link'}
          </button>

          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="w-full py-2 text-sm transition"
              style={{ color: '#888' }}
            >
              ← Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

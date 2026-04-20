'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validSession, setValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidSession(true)
    })
  }, [])

  const handleReset = async () => {
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#111111' }}>
      <div className="p-8 rounded-2xl shadow-xl w-full max-w-md" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2a2a2a' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#F5C800' }}>Angie's</h1>
          <p className="mt-1 text-sm" style={{ color: '#888' }}>Set New Password</p>
        </div>

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

        {!validSession ? (
          <div className="text-center py-4">
            <p className="text-sm mb-4" style={{ color: '#888' }}>This reset link is invalid or has expired.</p>
            <a href="/login" className="text-sm font-semibold hover:underline" style={{ color: '#F5C800' }}>
              Request a new reset link
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-white"
              style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              className="w-full px-4 py-3 rounded-xl outline-none text-white"
              style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
            />
            <button
              onClick={handleReset}
              disabled={loading || !password || !confirm}
              className="w-full font-bold py-3 rounded-xl transition disabled:opacity-50"
              style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

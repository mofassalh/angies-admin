'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#111111' }}>
      <div className="p-8 rounded-2xl shadow-xl w-full max-w-md" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2a2a2a' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#F5C800' }}>Angie's</h1>
          <p className="mt-1 text-sm" style={{ color: '#888' }}>Admin Panel</p>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none text-white"
            style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 rounded-xl outline-none text-white"
            style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
          />
          {error && <p className="text-sm" style={{ color: '#ff4444' }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl transition disabled:opacity-50"
            style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  )
}

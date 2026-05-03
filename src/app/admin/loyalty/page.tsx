'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Search, Gift, TrendingUp, Users, Star } from 'lucide-react'

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [points, setPoints] = useState('')
  const [type, setType] = useState('earn')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('customers')
  const [settings, setSettings] = useState({ points_per_dollar: '1', min_redeem: '100', redeem_value: '1' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [savedSettings, setSavedSettings] = useState(false)
  const supabase = createClient()

  const fetch = async () => {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, loyalty_points(points, type, description, created_at)')
      .order('total_points', { ascending: false })
    setCustomers(profiles || [])

    const { data: s } = await supabase.from('settings').select('*')
    if (s) {
      const map: any = {}
      s.forEach((r: any) => { map[r.key] = r.value })
      setSettings({
        points_per_dollar: map.points_per_dollar || '1',
        min_redeem: map.min_redeem || '100',
        redeem_value: map.redeem_value || '1',
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleAdjust = async () => {
    if (!selectedUser || !points) return
    setSaving(true)
    const pts = parseInt(points)
    await supabase.from('loyalty_points').insert({
      user_id: selectedUser.id,
      points: type === 'earn' ? pts : -pts,
      type,
      description: description || (type === 'earn' ? 'Manual points added' : 'Manual points deducted'),
    })
    const newTotal = (selectedUser.total_points || 0) + (type === 'earn' ? pts : -pts)
    await supabase.from('profiles').update({ total_points: Math.max(0, newTotal) }).eq('id', selectedUser.id)
    setSaving(false)
    setShowModal(false)
    setPoints('')
    setDescription('')
    await fetch()
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    }
    setSavingSettings(false)
    setSavedSettings(true)
    setTimeout(() => setSavedSettings(false), 2000)
  }

  const filtered = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const totalPoints = customers.reduce((s, c) => s + (c.total_points || 0), 0)
  const activeCustomers = customers.filter(c => (c.total_points || 0) > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Loyalty Program</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage customer points & rewards</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Customers', value: customers.length, icon: Users, color: '#4a9eff' },
          { label: 'Active Members', value: activeCustomers, icon: Star, color: '#F5C800' },
          { label: 'Total Points Issued', value: totalPoints.toLocaleString(), icon: Gift, color: '#22c55e' },
          { label: 'Pts per $1', value: settings.points_per_dollar, icon: TrendingUp, color: '#a855f7' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: '#888' }}>{k.label}</span>
              <k.icon size={18} style={{ color: k.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {['customers', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={{ background: tab === t ? '#1A1A1A' : 'white', color: tab === t ? 'white' : '#666', border: '1px solid #e5e5e5' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Customers tab */}
      {tab === 'customers' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#aaa' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: '#aaa' }}>No customers found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Customer', 'Phone', 'Total Points', 'Transactions', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length-1 ? '1px solid #f9f9f9' : 'none' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: '#FFF9E0', color: '#8A6800' }}>
                          {(c.full_name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{c.full_name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#888' }}>{c.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: '#1A1A1A' }}>{(c.total_points || 0).toLocaleString()}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FFF9E0', color: '#8A6800' }}>pts</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#888' }}>{(c.loyalty_points || []).length}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => { setSelectedUser(c); setShowModal(true) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: '#FFF9E0', color: '#8A6800', border: '1px solid #E8C84A' }}>
                        <Plus size={12} /> Adjust Points
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e5e5e5' }}>
          <div className="font-semibold text-sm mb-5" style={{ color: '#1A1A1A' }}>Points Configuration</div>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Points earned per $1 spent</label>
              <input type="number" value={settings.points_per_dollar}
                onChange={e => setSettings(s => ({ ...s, points_per_dollar: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <p className="text-xs mt-1" style={{ color: '#aaa' }}>e.g. 1 = earn 1 point per $1 spent</p>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Minimum points to redeem</label>
              <input type="number" value={settings.min_redeem}
                onChange={e => setSettings(s => ({ ...s, min_redeem: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <p className="text-xs mt-1" style={{ color: '#aaa' }}>e.g. 100 = need 100 points minimum to redeem</p>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Dollar value per 100 points</label>
              <input type="number" value={settings.redeem_value}
                onChange={e => setSettings(s => ({ ...s, redeem_value: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <p className="text-xs mt-1" style={{ color: '#aaa' }}>e.g. 1 = 100 points = $1 discount</p>
            </div>
            <button onClick={saveSettings} disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: savedSettings ? '#22c55e' : '#F5C800', color: savedSettings ? 'white' : '#1A1A1A' }}>
              {savingSettings ? 'Saving...' : savedSettings ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Adjust points modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#1A1A1A' }}>Adjust Points</h3>
            <p className="text-sm mb-5" style={{ color: '#888' }}>{selectedUser.full_name || 'Customer'} · {(selectedUser.total_points || 0)} pts</p>
            <div className="space-y-3">
              <div className="flex gap-2">
                {['earn', 'redeem', 'adjust'].map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
                    style={{ background: type === t ? '#1A1A1A' : '#f5f5f5', color: type === t ? 'white' : '#555' }}>
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Points</label>
                <input type="number" value={points} onChange={e => setPoints(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Note (optional)</label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Birthday bonus"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid #e5e5e5', color: '#555' }}>Cancel</button>
              <button onClick={handleAdjust} disabled={saving || !points}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: '#F5C800', color: '#1A1A1A' }}>
                {saving ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

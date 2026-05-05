'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Search, Gift, TrendingUp, Users, Star, Save } from 'lucide-react'

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
  const [settings, setSettings] = useState({
    is_active: true,
    points_per_dollar: 1,
    bonus_first_order: 50,
    min_points_redeem: 100,
    points_per_dollar_value: 100,
    max_discount_percent: 20,
    points_expiry_days: 365,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [savedSettings, setSavedSettings] = useState(false)
  const supabase = createClient()

  const RESTAURANT_ID = 1

  const loadData = async () => {
    setLoading(true)

    // Load loyalty settings
    const { data: ls } = await supabase
      .from('loyalty_settings')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .single()
    if (ls) setSettings(ls)

    // Load customers with their loyalty points
    const { data: lp } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('points', { ascending: false })

    if (lp && lp.length > 0) {
      const userIds = lp.map((l: any) => l.customer_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      const merged = lp.map((l: any) => {
        const profile = profiles?.find((p: any) => p.id === l.customer_id)
        return { ...l, full_name: profile?.full_name || 'Anonymous', phone: profile?.phone || '—', email: profile?.email || '—' }
      })
      setCustomers(merged)
    } else {
      setCustomers([])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleAdjust = async () => {
    if (!selectedUser || !points) return
    setSaving(true)
    const pts = parseInt(points)
    const change = type === 'earn' ? pts : -pts

    await supabase.from('loyalty_points')
      .update({
        points: Math.max(0, selectedUser.points + change),
        total_earned: type === 'earn' ? selectedUser.total_earned + pts : selectedUser.total_earned,
        total_redeemed: type === 'redeem' ? selectedUser.total_redeemed + pts : selectedUser.total_redeemed,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', selectedUser.customer_id)
      .eq('restaurant_id', RESTAURANT_ID)

    await supabase.from('loyalty_transactions').insert({
      customer_id: selectedUser.customer_id,
      restaurant_id: RESTAURANT_ID,
      type: type === 'earn' ? 'earn' : 'redeem',
      points: pts,
      description: description || (type === 'earn' ? 'Manual points added' : 'Manual points deducted'),
    })

    setSaving(false)
    setShowModal(false)
    setPoints('')
    setDescription('')
    await loadData()
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    await supabase.from('loyalty_settings')
      .update({
        is_active: settings.is_active,
        points_per_dollar: settings.points_per_dollar,
        bonus_first_order: settings.bonus_first_order,
        min_points_redeem: settings.min_points_redeem,
        points_per_dollar_value: settings.points_per_dollar_value,
        max_discount_percent: settings.max_discount_percent,
        points_expiry_days: settings.points_expiry_days,
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_id', RESTAURANT_ID)
    setSavingSettings(false)
    setSavedSettings(true)
    setTimeout(() => setSavedSettings(false), 2000)
  }

  const filtered = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const totalPoints = customers.reduce((s, c) => s + (c.points || 0), 0)
  const activeCustomers = customers.filter(c => (c.points || 0) > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Loyalty Program</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage customer points & rewards</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#888' }}>Program</span>
          <button onClick={() => setSettings(s => ({ ...s, is_active: !s.is_active }))}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: settings.is_active ? '#F5C800' : '#E5E7EB' }}>
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: settings.is_active ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
          <span className="text-xs font-semibold" style={{ color: settings.is_active ? '#D4A900' : '#aaa' }}>
            {settings.is_active ? 'Active' : 'Inactive'}
          </span>
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
            {t === 'customers' ? 'Customers' : 'Settings'}
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
            <div className="p-8 text-center">
              <div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: '#aaa' }}>No customers found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Customer', 'Phone', 'Points', 'Total Earned', 'Total Redeemed', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.customer_id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: '#FFF9E0', color: '#8A6800' }}>
                          {(c.full_name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: '#1A1A1A' }}>{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: '#888' }}>{c.phone}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold" style={{ color: '#1A1A1A' }}>{(c.points || 0).toLocaleString()}</span>
                      <span className="text-xs ml-1 px-1.5 py-0.5 rounded-full" style={{ background: '#FFF9E0', color: '#8A6800' }}>pts</span>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#888' }}>{(c.total_earned || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#888' }}>{(c.total_redeemed || 0).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => { setSelectedUser(c); setShowModal(true) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: '#FFF9E0', color: '#8A6800', border: '1px solid #E8C84A' }}>
                        <Plus size={12} /> Adjust
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
          <div className="font-semibold mb-6" style={{ color: '#1A1A1A' }}>Points Configuration</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
            {[
              { key: 'points_per_dollar', label: 'Points earned per $1 spent', hint: 'e.g. 1 = earn 1 point per $1' },
              { key: 'bonus_first_order', label: 'Bonus points on first order', hint: 'e.g. 50 = 50 bonus points for new customers' },
              { key: 'min_points_redeem', label: 'Minimum points to redeem', hint: 'e.g. 100 = need at least 100 points' },
              { key: 'points_per_dollar_value', label: 'Points needed for $1 discount', hint: 'e.g. 100 = 100 points = $1 off' },
              { key: 'max_discount_percent', label: 'Max discount per order (%)', hint: 'e.g. 20 = max 20% off per order' },
              { key: 'points_expiry_days', label: 'Points expiry (days)', hint: 'e.g. 365 = points expire after 1 year' },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>{label}</label>
                <input type="number"
                  value={(settings as any)[key]}
                  onChange={e => setSettings(s => ({ ...s, [key]: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                <p className="text-xs mt-1" style={{ color: '#aaa' }}>{hint}</p>
              </div>
            ))}
          </div>
          <button onClick={saveSettings} disabled={savingSettings}
            className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: savedSettings ? '#22c55e' : '#F5C800', color: savedSettings ? 'white' : '#1A1A1A' }}>
            <Save size={14} />
            {savingSettings ? 'Saving...' : savedSettings ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Adjust points modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#1A1A1A' }}>Adjust Points</h3>
            <p className="text-sm mb-5" style={{ color: '#888' }}>{selectedUser.full_name} · {selectedUser.points} pts</p>
            <div className="space-y-3">
              <div className="flex gap-2">
                {['earn', 'redeem'].map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
                    style={{ background: type === t ? '#1A1A1A' : '#f5f5f5', color: type === t ? 'white' : '#555' }}>
                    {t === 'earn' ? '+ Add Points' : '- Deduct Points'}
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
              <button onClick={() => { setShowModal(false); setPoints(''); setDescription('') }}
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

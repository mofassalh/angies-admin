'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, X, Tag, Percent, Calendar } from 'lucide-react'

type Promo = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_order: number
  max_uses: number
  used_count: number
  expires_at: string
  is_active: boolean
  description: string
}

const empty = {
  code: '', type: 'percent' as const, value: 10,
  min_order: 0, max_uses: 100, expires_at: '',
  is_active: true, description: ''
}

export default function MarketingPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Promo | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('coupons')
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const openAdd = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (p: Promo) => {
    setEditing(p)
    setForm({ code: p.code, type: p.type, value: p.value, min_order: p.min_order, max_uses: p.max_uses, expires_at: p.expires_at?.slice(0,10) || '', is_active: p.is_active, description: p.description || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code) return
    setSaving(true)
    const payload = { ...form, expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null }
    if (editing) {
      await supabase.from('promotions').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('promotions').insert({ ...payload, used_count: 0 })
    }
    await fetch()
    setShowModal(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return
    await supabase.from('promotions').delete().eq('id', id)
    await fetch()
  }

  const toggleActive = async (p: Promo) => {
    await supabase.from('promotions').update({ is_active: !p.is_active }).eq('id', p.id)
    await fetch()
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(f => ({ ...f, code }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Marketing</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage promotions & discount codes</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={15} /> Add Coupon
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['coupons', 'overview'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={{ background: tab === t ? '#1A1A1A' : 'white', color: tab === t ? 'white' : '#666', border: '1px solid #e5e5e5' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Coupons', value: promos.length },
            { label: 'Active', value: promos.filter(p => p.is_active).length },
            { label: 'Total Uses', value: promos.reduce((s,p) => s + (p.used_count||0), 0) },
            { label: 'Expired', value: promos.filter(p => p.expires_at && new Date(p.expires_at) < new Date()).length },
          ].map((k,i) => (
            <div key={i} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
              <div className="text-xs font-medium mb-2" style={{ color: '#888' }}>{k.label}</div>
              <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'coupons' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
            </div>
          ) : promos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🏷️</div>
              <p className="text-sm mb-4" style={{ color: '#aaa' }}>No promotions yet</p>
              <button onClick={openAdd} className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#F5C800', color: '#1A1A1A' }}>Create First Coupon</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {promos.map((p, i) => {
                  const expired = p.expires_at && new Date(p.expires_at) < new Date()
                  return (
                    <tr key={p.id} style={{ borderBottom: i < promos.length-1 ? '1px solid #f9f9f9' : 'none' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={13} style={{ color: '#F5C800' }} />
                          <span className="font-mono font-semibold text-sm" style={{ color: '#1A1A1A' }}>{p.code}</span>
                        </div>
                        {p.description && <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>{p.description}</div>}
                      </td>
                      <td className="px-5 py-4 text-xs capitalize" style={{ color: '#555' }}>{p.type}</td>
                      <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#1A1A1A' }}>
                        {p.type === 'percent' ? `${p.value}%` : `$${p.value}`}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#555' }}>${p.min_order || 0}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#555' }}>{p.used_count || 0}/{p.max_uses}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: expired ? '#dc2626' : '#555' }}>
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString('en-AU') : '—'}
                        {expired && <span className="ml-1 text-xs" style={{ color: '#dc2626' }}>Expired</span>}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleActive(p)}
                          className="relative w-10 h-5 rounded-full transition-all"
                          style={{ backgroundColor: p.is_active ? '#F5C800' : '#e5e5e5' }}>
                          <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                            style={{ left: p.is_active ? '18px' : '2px' }} />
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100">
                            <Pencil size={13} style={{ color: '#555' }} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 size={13} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: '#1A1A1A' }}>{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#aaa' }}><X size={20} /></button>
            </div>
            <div className="space-y-4">

              {/* Code */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Coupon Code *</label>
                <div className="flex gap-2">
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE10"
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                  <button onClick={generateCode} className="px-3 py-2.5 rounded-xl text-xs font-medium"
                    style={{ border: '1px solid #e5e5e5', color: '#555' }}>Generate</button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="10% off all orders"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              </div>

              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Discount Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>
                    Value {form.type === 'percent' ? '(%)' : '($)'}
                  </label>
                  <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                </div>
              </div>

              {/* Min order + Max uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Min Order ($)</label>
                  <input type="number" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                </div>
              </div>

              {/* Expires */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ backgroundColor: form.is_active ? '#F5C800' : '#e5e5e5' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: form.is_active ? '18px' : '2px' }} />
                </button>
                <span className="text-sm" style={{ color: '#555' }}>Active</span>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid #e5e5e5', color: '#555' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.code}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: '#F5C800', color: '#1A1A1A' }}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

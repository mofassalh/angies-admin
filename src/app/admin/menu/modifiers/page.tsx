'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

type Option = { name: string; price: number }
type Modifier = {
  id: string
  name: string
  type: 'radio' | 'checkbox'
  required: boolean
  min_select: number
  max_select: number
  options: Option[]
  created_at: string
}

const empty = {
  name: '', type: 'radio' as const, required: false,
  min_select: 0, max_select: 1, options: [{ name: '', price: 0 }]
}

export default function ModifiersPage() {
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Modifier | null>(null)
  const [form, setForm] = useState<any>(empty)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('modifiers').select('*').order('created_at', { ascending: false })
    setModifiers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const openAdd = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (m: Modifier) => {
    setEditing(m)
    setForm({ name: m.name, type: m.type, required: m.required, min_select: m.min_select, max_select: m.max_select, options: m.options })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const payload = { name: form.name, type: form.type, required: form.required, min_select: form.min_select, max_select: form.max_select, options: form.options.filter((o: Option) => o.name) }
    if (editing) {
      await supabase.from('modifiers').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('modifiers').insert(payload)
    }
    await fetch()
    setShowModal(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this modifier?')) return
    await supabase.from('modifiers').delete().eq('id', id)
    await fetch()
  }

  const addOption = () => setForm((f: any) => ({ ...f, options: [...f.options, { name: '', price: 0 }] }))
  const updateOption = (i: number, key: string, value: any) => {
    const opts = [...form.options]
    opts[i] = { ...opts[i], [key]: value }
    setForm((f: any) => ({ ...f, options: opts }))
  }
  const removeOption = (i: number) => setForm((f: any) => ({ ...f, options: f.options.filter((_: any, idx: number) => idx !== i) }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Modifiers</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{modifiers.length} modifier groups</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={15} /> Add Modifier
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
        </div>
      ) : modifiers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #e5e5e5' }}>
          <div className="text-4xl mb-3">🔧</div>
          <p className="font-semibold mb-1" style={{ color: '#1A1A1A' }}>No modifiers yet</p>
          <p className="text-sm mb-4" style={{ color: '#aaa' }}>Create modifier groups like "Choose Sauce", "Add Extras"</p>
          <button onClick={openAdd} className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#F5C800', color: '#1A1A1A' }}>Create First Modifier</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modifiers.map(mod => (
            <div key={mod.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{mod.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: mod.type === 'radio' ? '#EFF6FF' : '#F0FDF4', color: mod.type === 'radio' ? '#1d4ed8' : '#15803d' }}>
                      {mod.type === 'radio' ? 'Single select' : 'Multi select'}
                    </span>
                    {mod.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FFF9E0', color: '#8A6800' }}>Required</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(mod)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Pencil size={13} style={{ color: '#555' }} />
                  </button>
                  <button onClick={() => handleDelete(mod.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={13} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                {mod.options.slice(0, 4).map((opt, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg"
                    style={{ background: '#fafafa' }}>
                    <span style={{ color: '#555' }}>{opt.name}</span>
                    <span style={{ color: opt.price > 0 ? '#16a34a' : '#aaa' }}>
                      {opt.price > 0 ? `+$${opt.price.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                ))}
                {mod.options.length > 4 && (
                  <div className="text-xs text-center pt-1" style={{ color: '#aaa' }}>+{mod.options.length - 4} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: '#1A1A1A' }}>{editing ? 'Edit Modifier' : 'New Modifier'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#aaa' }}><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Group Name *</label>
                <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Choose Sauce, Add Extras"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Type</label>
                  <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
                    <option value="radio">Single select</option>
                    <option value="checkbox">Multi select</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Max Select</label>
                  <input type="number" value={form.max_select}
                    onChange={e => setForm((f: any) => ({ ...f, max_select: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setForm((f: any) => ({ ...f, required: !f.required }))}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ backgroundColor: form.required ? '#F5C800' : '#e5e5e5' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: form.required ? '18px' : '2px' }} />
                </button>
                <span className="text-sm" style={{ color: '#555' }}>Required</span>
              </div>

              {/* Options */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: '#888' }}>Options</label>
                <div className="space-y-2">
                  {form.options.map((opt: Option, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input placeholder="Option name" value={opt.name}
                        onChange={e => updateOption(i, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ color: '#aaa' }}>+$</span>
                        <input type="number" step="0.5" value={opt.price}
                          onChange={e => updateOption(i, 'price', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-2 rounded-lg text-sm outline-none text-center"
                          style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                      </div>
                      {form.options.length > 1 && (
                        <button onClick={() => removeOption(i)} style={{ color: '#ccc' }}><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addOption}
                  className="mt-2 w-full py-2 rounded-xl text-xs font-medium"
                  style={{ border: '1px dashed #e5e5e5', color: '#888' }}>
                  + Add Option
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid #e5e5e5', color: '#555' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: '#F5C800', color: '#1A1A1A' }}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

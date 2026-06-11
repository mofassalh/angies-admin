'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { Plus, Trash2, Save, ChevronDown, ChevronUp, X } from 'lucide-react'

type Option = { name: string; price: number }
type Section = { name: string; type: 'radio' | 'checkbox'; max: number; options: Option[] }
type Template = { id: string; name: string; sections: Section[] }

const emptySection = (): Section => ({ name: '', type: 'radio', max: 1, options: [{ name: '', price: 0 }] })
const emptyTemplate = (): Template => ({ id: '', name: '', sections: [emptySection()] })

export default function CustomizationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState<Template>(emptyTemplate())
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'customization_templates')
      .eq('restaurant_id', RESTAURANT_ID)
      .single()
    if (data?.value) {
      try { setTemplates(JSON.parse(data.value)) } catch {}
    }
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const save = async (updated: Template[]) => {
    await supabase.from('settings').upsert(
      { key: 'customization_templates', value: JSON.stringify(updated), restaurant_id: RESTAURANT_ID },
      { onConflict: 'key,restaurant_id' }
    )
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyTemplate())
    setShowModal(true)
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setForm({ ...t, sections: t.sections.map(s => ({ ...s, options: [...s.options] })) })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const newTemplate = { ...form, id: editing?.id || Date.now().toString() }
    const updated = editing
      ? templates.map(t => t.id === editing.id ? newTemplate : t)
      : [...templates, newTemplate]
    setTemplates(updated)
    await save(updated)
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    await save(updated)
  }

  const addSection = () => setForm(f => ({ ...f, sections: [...f.sections, emptySection()] }))
  const removeSection = (i: number) => setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }))
  const updateSection = (i: number, key: string, value: any) => {
    const s = [...form.sections]
    s[i] = { ...s[i], [key]: value }
    setForm(f => ({ ...f, sections: s }))
  }
  const addOption = (si: number) => {
    const s = [...form.sections]
    s[si].options = [...s[si].options, { name: '', price: 0 }]
    setForm(f => ({ ...f, sections: s }))
  }
  const removeOption = (si: number, oi: number) => {
    const s = [...form.sections]
    s[si].options = s[si].options.filter((_, idx) => idx !== oi)
    setForm(f => ({ ...f, sections: s }))
  }
  const updateOption = (si: number, oi: number, key: string, value: any) => {
    const s = [...form.sections]
    s[si].options[oi] = { ...s[si].options[oi], [key]: value }
    setForm(f => ({ ...f, sections: s }))
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Customization Templates</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Save reusable customization sections for menu items</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ background: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={16} /> Add Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #e5e5e5' }}>
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">No templates yet. Create one to reuse across menu items.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-gray-900">{t.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ border: '1px solid #e5e5e5', color: '#555' }}>Edit</button>
                  <button onClick={() => handleDelete(t.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-red-500"
                    style={{ border: '1px solid #fee2e2' }}>Delete</button>
                </div>
              </div>
              <div className="space-y-1">
                {t.sections.map((s, i) => (
                  <div key={i} className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{s.name}</span>
                    {' · '}{s.type}{' · '}{s.options.length} options
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editing ? 'Edit Template' : 'New Template'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Template Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Kebab Extras, Burger Options"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5' }} />
            </div>

            <div className="space-y-4 mb-4">
              {form.sections.map((section, si) => (
                <div key={si} className="rounded-xl p-4" style={{ background: '#f9f9f9', border: '1px solid #e5e5e5' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500">Section {si + 1}</span>
                    {form.sections.length > 1 && (
                      <button onClick={() => removeSection(si)}><X size={14} className="text-gray-400" /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Section Name</label>
                      <input value={section.name} onChange={e => updateSection(si, 'name', e.target.value)}
                        placeholder="e.g. Choose Size"
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #e5e5e5', background: 'white' }} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Type</label>
                      <select value={section.type} onChange={e => updateSection(si, 'type', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #e5e5e5', background: 'white' }}>
                        <option value="radio">Radio (pick one)</option>
                        <option value="checkbox">Checkbox (pick many)</option>
                      </select>
                    </div>
                    {section.type === 'checkbox' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Max Select</label>
                        <input type="number" min="1" value={section.max}
                          onChange={e => updateSection(si, 'max', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: '1px solid #e5e5e5', background: 'white' }} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 mb-2">
                    {section.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input value={opt.name} onChange={e => updateOption(si, oi, 'name', e.target.value)}
                          placeholder="Option name"
                          className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                          style={{ border: '1px solid #e5e5e5', background: 'white' }} />
                        <input type="number" value={opt.price} onChange={e => updateOption(si, oi, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none"
                          style={{ border: '1px solid #e5e5e5', background: 'white' }} />
                        {section.options.length > 1 && (
                          <button onClick={() => removeOption(si, oi)}><X size={12} className="text-gray-400" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addOption(si)}
                    className="text-xs text-yellow-600 font-medium">+ Add Option</button>
                </div>
              ))}
            </div>

            <button onClick={addSection}
              className="w-full py-2.5 rounded-xl text-sm font-medium mb-4"
              style={{ border: '1px dashed #e5e5e5', color: '#888' }}>
              + Add Section
            </button>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid #e5e5e5', color: '#555' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#F5C800', color: '#1A1A1A' }}>
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

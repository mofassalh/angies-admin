'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { Plus, Pencil, Trash2, X, Check, Upload, ChevronDown, ChevronUp } from 'lucide-react'

type Option = { name: string; price: number }
type Section = { name: string; type: 'radio' | 'checkbox'; max: number; options: Option[] }
type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  available: boolean
  location: string
  customizations: Section[]
}

const LOCATIONS = ['all', 'St Albans', 'Fitzroy North', 'Ascot Vale']
const empty = { id: '', name: '', description: '', price: '', category: '', image_url: '', available: true, location: 'all', customizations: [] }

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [editing, setEditing] = useState(false)
  const [filterCat, setFilterCat] = useState('All')
  const [uploading, setUploading] = useState(false)
  const [customCat, setCustomCat] = useState(false)
  const [showCustomizations, setShowCustomizations] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const fetchItems = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    supabase.from('settings').select('value').eq('key', 'customization_templates').eq('restaurant_id', RESTAURANT_ID).single().then(({ data }) => {
      if (data?.value) { try { setTemplates(JSON.parse(data.value)) } catch {} }
    })
  }, [])

  const allCategories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const openAdd = () => { setForm(empty); setEditing(false); setCustomCat(false); setShowCustomizations(false); setShowModal(true) }
  const openEdit = (item: MenuItem) => {
    setForm({ ...item, price: String(item.price), customizations: item.customizations || [] })
    setEditing(true)
    setCustomCat(false)
    setShowCustomizations((item.customizations || []).length > 0)
    setShowModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
      setForm((f: any) => ({ ...f, image_url: urlData.publicUrl }))
    }
    setUploading(false)
  }

  // Section helpers
  const addSection = () => {
    setForm((f: any) => ({
      ...f,
      customizations: [...(f.customizations || []), { name: '', type: 'radio', max: 1, options: [{ name: '', price: 0 }] }]
    }))
  }

  const updateSection = (si: number, key: string, value: any) => {
    const c = [...form.customizations]
    c[si] = { ...c[si], [key]: value }
    setForm((f: any) => ({ ...f, customizations: c }))
  }

  const removeSection = (si: number) => {
    setForm((f: any) => ({ ...f, customizations: f.customizations.filter((_: any, i: number) => i !== si) }))
  }

  const addOption = (si: number) => {
    const c = [...form.customizations]
    c[si].options = [...c[si].options, { name: '', price: 0 }]
    setForm((f: any) => ({ ...f, customizations: c }))
  }

  const updateOption = (si: number, oi: number, key: string, value: any) => {
    const c = [...form.customizations]
    c[si].options[oi] = { ...c[si].options[oi], [key]: value }
    setForm((f: any) => ({ ...f, customizations: c }))
  }

  const removeOption = (si: number, oi: number) => {
    const c = [...form.customizations]
    c[si].options = c[si].options.filter((_: any, i: number) => i !== oi)
    setForm((f: any) => ({ ...f, customizations: c }))
  }

  const handleSave = async () => {
    if (!form.name || !form.price) return
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      image_url: form.image_url,
      available: form.available,
      location: form.location,
      customizations: form.customizations || [],
    }
    if (editing) {
      await supabase.from('menu_items').update(payload).eq('id', form.id)
    } else {
      await supabase.from('menu_items').insert(payload)
    }
    setShowModal(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    fetchItems()
  }

  const toggleAvailable = async (item: MenuItem) => {
    await supabase.from('menu_items').update({ available: !item.available }).eq('id', item.id)
    fetchItems()
  }

  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Menu</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{items.length} items</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', ...allCategories].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: filterCat === cat ? '#F5C800' : '#fff',
              color: filterCat === cat ? '#1A1A1A' : '#666',
              border: '1px solid #e5e5e5'
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        {loading ? (
          <p className="p-6 text-sm" style={{ color: '#aaa' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm" style={{ color: '#aaa' }}>No items found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Name</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Category</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Price</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Location</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Customs</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Available</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <td className="px-6 py-4" style={{ color: '#1A1A1A' }}>
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: '#f5f5f5' }}>🍽️</div>
                      )}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>{item.description.slice(0, 40)}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#fff8e1', color: '#b8860b' }}>
                      {item.category || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold" style={{ color: '#1A1A1A' }}>${item.price}</td>
                  <td className="px-6 py-4 text-xs" style={{ color: '#555' }}>{item.location}</td>
                  <td className="px-6 py-4 text-xs" style={{ color: '#888' }}>
                    {(item.customizations || []).length > 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs"
                        style={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                        {item.customizations.length} sections
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleAvailable(item)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: item.available ? '#F5C800' : '#e5e5e5' }}>
                      {item.available && <Check size={14} style={{ color: '#1A1A1A' }} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-2 rounded-lg"
                        style={{ backgroundColor: '#f5f5f5', color: '#555' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg"
                        style={{ backgroundColor: '#fff0f0', color: '#ff4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                {editing ? 'Edit Item' : 'Add Item'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#aaa' }}><X size={20} /></button>
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <div className="w-full h-32 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
                style={{ border: '2px dashed #e5e5e5', backgroundColor: '#fafafa' }}
                onClick={() => fileRef.current?.click()}>
                {form.image_url ? (
                  <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload size={24} style={{ color: '#aaa' }} />
                    <p className="text-sm mt-2" style={{ color: '#aaa' }}>
                      {uploading ? 'Uploading...' : 'Click to upload image'}
                    </p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <div className="space-y-3">
              <input placeholder="Name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <textarea placeholder="Description" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <input placeholder="Price *" type="number" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />

              {/* Category */}
              {!customCat ? (
                <div className="flex gap-2">
                  <select value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
                    <option value="">Select category</option>
                    {allCategories.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <button onClick={() => { setCustomCat(true); setForm({ ...form, category: '' }) }}
                    className="px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: '1px solid #e5e5e5', color: '#555' }}>+ New</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input placeholder="New category" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #F5C800', color: '#1A1A1A' }} />
                  <button onClick={() => setCustomCat(false)}
                    className="px-3 py-2.5 rounded-xl text-sm"
                    style={{ border: '1px solid #e5e5e5', color: '#555' }}>List</button>
                </div>
              )}

              <select value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* Customizations */}
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCustomizations(!showCustomizations)}
                  className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: '#f9f9f9', color: '#1A1A1A' }}>
                  <span>Customizations {form.customizations?.length > 0 ? `(${form.customizations.length} sections)` : ''}</span>
                  {showCustomizations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {templates.length > 0 && (
                  <div className="relative">
                    <button onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                      className="px-3 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
                      style={{ backgroundColor: '#FFF9E0', color: '#D4A900', border: '1px solid #F5C800' }}>
                      Load Template
                    </button>
                    {showTemplateDropdown && (
                      <div className="absolute right-0 top-12 z-50 bg-white rounded-xl shadow-xl min-w-48 overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
                        {templates.map(t => (
                          <button key={t.id} onClick={() => {
                            setForm((f: any) => ({ ...f, customizations: [...(f.customizations || []), ...t.sections] }))
                            setShowCustomizations(true)
                            setShowTemplateDropdown(false)
                          }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0"
                            style={{ borderColor: '#f5f5f5', color: '#1A1A1A' }}>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{t.sections.length} sections</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showCustomizations && (
                <div className="mt-3 space-y-4">
                  {(form.customizations || []).map((section: Section, si: number) => (
                    <div key={si} className="rounded-xl p-4" style={{ border: '1px solid #e5e5e5' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <input placeholder="Section name (e.g. Choose Sauce)"
                          value={section.name}
                          onChange={e => updateSection(si, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                        <button onClick={() => removeSection(si)}
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: '#fff0f0', color: '#ff4444' }}>
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <select value={section.type}
                          onChange={e => updateSection(si, 'type', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
                          <option value="radio">Radio (pick one)</option>
                          <option value="checkbox">Checkbox (pick multiple)</option>
                        </select>
                        {section.type === 'checkbox' && (
                          <input type="number" placeholder="Max" value={section.max}
                            onChange={e => updateSection(si, 'max', parseInt(e.target.value))}
                            className="w-20 px-3 py-2 rounded-lg text-sm outline-none text-center"
                            style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                        )}
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {section.options.map((opt: Option, oi: number) => (
                          <div key={oi} className="flex gap-2 items-center">
                            <input placeholder="Option name" value={opt.name}
                              onChange={e => updateOption(si, oi, 'name', e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                            <input type="number" placeholder="+$" value={opt.price}
                              onChange={e => updateOption(si, oi, 'price', parseFloat(e.target.value) || 0)}
                              className="w-16 px-3 py-1.5 rounded-lg text-sm outline-none text-center"
                              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                            <button onClick={() => removeOption(si, oi)}
                              style={{ color: '#ccc' }}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addOption(si)}
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: '#f5f5f5', color: '#555' }}>
                        + Add Option
                      </button>
                    </div>
                  ))}

                  <button onClick={addSection}
                    className="w-full py-2.5 rounded-xl text-sm font-medium"
                    style={{ border: '2px dashed #e5e5e5', color: '#888' }}>
                    + Add Section
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #e5e5e5', color: '#555' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
                {editing ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

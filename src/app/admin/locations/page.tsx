'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MapPin, Plus, Pencil, Trash2, X, Check } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
  phone: string
  email: string
  hours: string
  is_active: boolean
}

const empty: Omit<Location, 'id'> = {
  name: '', address: '', phone: '', email: '', hours: '', is_active: true
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('name')
    if (data) setLocations(data)
    setLoading(false)
  }

  useEffect(() => { fetchLocations() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(empty)
    setShowModal(true)
  }

  const openEdit = (loc: Location) => {
    setEditing(loc)
    setForm({ name: loc.name, address: loc.address, phone: loc.phone, email: loc.email, hours: loc.hours, is_active: loc.is_active })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.address) return
    setSaving(true)
    if (editing) {
      await supabase.from('locations').update(form).eq('id', editing.id)
    } else {
      await supabase.from('locations').insert(form)
    }
    await fetchLocations()
    setShowModal(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location?')) return
    await supabase.from('locations').delete().eq('id', id)
    await fetchLocations()
  }

  const toggleActive = async (loc: Location) => {
    await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', loc.id)
    await fetchLocations()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Locations</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{locations.length} location{locations.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={16} /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map(loc => (
          <div key={loc.id} className="rounded-2xl p-5" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} style={{ color: '#F5C800' }} />
                <h3 className="font-bold text-white">{loc.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(loc)}
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: loc.is_active ? '#064e3b' : '#2a2a2a', color: loc.is_active ? '#10B981' : '#888' }}>
                  {loc.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => openEdit(loc)} className="p-1.5 rounded-lg transition hover:bg-gray-700">
                  <Pencil size={14} style={{ color: '#888' }} />
                </button>
                <button onClick={() => handleDelete(loc.id)} className="p-1.5 rounded-lg transition hover:bg-red-900">
                  <Trash2 size={14} style={{ color: '#ef4444' }} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm" style={{ color: '#aaa' }}>
              {loc.address && <div>📍 {loc.address}</div>}
              {loc.phone && <div>📞 {loc.phone}</div>}
              {loc.email && <div>✉️ {loc.email}</div>}
              {loc.hours && <div>🕐 {loc.hours}</div>}
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="col-span-2 text-center py-16 rounded-2xl" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a' }}>
            <MapPin size={40} className="mx-auto mb-3" style={{ color: '#444' }} />
            <p style={{ color: '#888' }}>No locations yet</p>
            <button onClick={openAdd} className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
              Add First Location
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Location' : 'Add Location'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} style={{ color: '#888' }} /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Name *', placeholder: 'St Albans' },
                { key: 'address', label: 'Address *', placeholder: '123 Main St, St Albans VIC 3021' },
                { key: 'phone', label: 'Phone', placeholder: '03 XXXX XXXX' },
                { key: 'email', label: 'Email', placeholder: 'stalbans@angies.com.au' },
                { key: 'hours', label: 'Hours', placeholder: 'Mon-Sun 11am-10pm' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>{field.label}</label>
                  <input
                    type="text"
                    value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className="w-10 h-6 rounded-full transition-all relative"
                  style={{ backgroundColor: form.is_active ? '#F5C800' : '#333' }}>
                  <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: form.is_active ? '22px' : '2px' }} />
                </button>
                <span className="text-sm" style={{ color: '#aaa' }}>Active</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#2a2a2a', color: '#aaa' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.address}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

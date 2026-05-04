'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Trash2, MapPin } from 'lucide-react'

type Zone = {
  id: string
  suburb: string
  postcode: string
  fee: number
  min_order: number
  is_active: boolean
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [newZone, setNewZone] = useState({ suburb: '', postcode: '', fee: '5.00', min_order: '15.00' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('delivery_zones').select('*').order('suburb')
    setZones(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleAdd = async () => {
    if (!newZone.suburb) return
    setSaving(true)
    await supabase.from('delivery_zones').insert({
      suburb: newZone.suburb,
      postcode: newZone.postcode,
      fee: parseFloat(newZone.fee),
      min_order: parseFloat(newZone.min_order),
      is_active: true,
    })
    await fetch()
    setNewZone({ suburb: '', postcode: '', fee: '5.00', min_order: '15.00' })
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this zone?')) return
    await supabase.from('delivery_zones').delete().eq('id', id)
    await fetch()
  }

  const toggleActive = async (zone: Zone) => {
    await supabase.from('delivery_zones').update({ is_active: !zone.is_active }).eq('id', zone.id)
    await fetch()
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Delivery Zones</h2>
        <p className="text-sm mt-1" style={{ color: '#888' }}>Manage suburbs you deliver to</p>
      </div>

      {/* Add zone */}
      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #e5e5e5' }}>
        <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Add Delivery Zone</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Suburb *</label>
            <input value={newZone.suburb} onChange={e => setNewZone(z => ({ ...z, suburb: e.target.value }))}
              placeholder="St Albans"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Postcode</label>
            <input value={newZone.postcode} onChange={e => setNewZone(z => ({ ...z, postcode: e.target.value }))}
              placeholder="3021"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Delivery Fee ($)</label>
            <input type="number" step="0.50" value={newZone.fee}
              onChange={e => setNewZone(z => ({ ...z, fee: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Min Order ($)</label>
            <input type="number" step="0.50" value={newZone.min_order}
              onChange={e => setNewZone(z => ({ ...z, min_order: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
        </div>
        <button onClick={handleAdd} disabled={saving || !newZone.suburb}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={15} /> {saving ? 'Adding...' : 'Add Zone'}
        </button>
      </div>

      {/* Zones list */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} /></div>
        ) : zones.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin size={32} className="mx-auto mb-3" style={{ color: '#e5e5e5' }} />
            <p className="text-sm" style={{ color: '#aaa' }}>No delivery zones yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                {['Suburb', 'Postcode', 'Delivery Fee', 'Min Order', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, i) => (
                <tr key={zone.id} style={{ borderBottom: i < zones.length-1 ? '1px solid #f9f9f9' : 'none' }}>
                  <td className="px-5 py-3 font-medium text-sm" style={{ color: '#1A1A1A' }}>{zone.suburb}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: '#888' }}>{zone.postcode || '—'}</td>
                  <td className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A1A' }}>${zone.fee.toFixed(2)}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: '#888' }}>${zone.min_order.toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(zone)}
                      className="relative w-10 h-5 rounded-full transition-all"
                      style={{ backgroundColor: zone.is_active ? '#22c55e' : '#e5e5e5' }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                        style={{ left: zone.is_active ? '18px' : '2px' }} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(zone.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={13} style={{ color: '#ef4444' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

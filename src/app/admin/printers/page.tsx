'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { Plus, Trash2, Save, Printer } from 'lucide-react'

export default function PrintersPage() {
  const [printers, setPrinters] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: printerData }, { data: locationData }] = await Promise.all([
      supabase.from('printers').select('*').eq('restaurant_id', RESTAURANT_ID).order('created_at'),
      supabase.from('locations').select('*').eq('restaurant_id', RESTAURANT_ID).eq('is_active', true),
    ])
    setPrinters(printerData || [])
    setLocations(locationData || [])
    setLoading(false)
  }

  function addPrinter() {
    setPrinters(p => [...p, {
      id: 'new_' + Date.now(),
      restaurant_id: RESTAURANT_ID,
      location_id: locations[0]?.id || null,
      name: '',
      ip_address: '',
      port: 9100,
      enabled: true,
      isNew: true,
    }])
  }

  async function savePrinter(printer: any) {
    setSaving(printer.id)
    const payload = {
      restaurant_id: RESTAURANT_ID,
      location_id: printer.location_id,
      name: printer.name,
      ip_address: printer.ip_address,
      port: printer.port || 9100,
      enabled: printer.enabled,
    }
    if (printer.isNew) {
      const { data } = await supabase.from('printers').insert(payload).select().single()
      if (data) {
        setPrinters(p => p.map(x => x.id === printer.id ? { ...data } : x))
      }
    } else {
      await supabase.from('printers').update(payload).eq('id', printer.id)
    }
    setSaving(null)
  }

  async function deletePrinter(printer: any) {
    if (printer.isNew) {
      setPrinters(p => p.filter(x => x.id !== printer.id))
      return
    }
    await supabase.from('printers').delete().eq('id', printer.id)
    setPrinters(p => p.filter(x => x.id !== printer.id))
  }

  function updatePrinter(id: string, field: string, value: any) {
    setPrinters(p => p.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  if (loading) return <p className="text-sm" style={{ color: '#aaa' }}>Loading...</p>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Kitchen Printers</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage receipt printers for each location</p>
        </div>
        <button onClick={addPrinter}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={16} />
          Add Printer
        </button>
      </div>

      {printers.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
          <Printer size={40} style={{ color: '#ddd', margin: '0 auto 12px' }} />
          <p className="font-semibold" style={{ color: '#1A1A1A' }}>No printers added yet</p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Click "Add Printer" to add your first kitchen printer</p>
        </div>
      )}

      <div className="space-y-4">
        {printers.map(printer => (
          <div key={printer.id} className="rounded-2xl p-6" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Printer size={18} style={{ color: '#F5C800' }} />
                <span className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>
                  {printer.name || 'New Printer'}
                </span>
                {printer.isNew && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF9E0', color: '#B8860B', border: '1px solid #F5C800' }}>New</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updatePrinter(printer.id, 'enabled', !printer.enabled)}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: printer.enabled ? '#F5C800' : '#e5e5e5' }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: printer.enabled ? '24px' : '4px' }} />
                </button>
                <button onClick={() => deletePrinter(printer)}
                  className="p-2 rounded-xl"
                  style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm mb-1 block" style={{ color: '#555' }}>Printer Name</label>
                <input
                  value={printer.name}
                  onChange={e => updatePrinter(printer.id, 'name', e.target.value)}
                  placeholder="e.g. Kitchen Printer - St Albans"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              </div>
              <div>
                <label className="text-sm mb-1 block" style={{ color: '#555' }}>Location</label>
                <select
                  value={printer.location_id || ''}
                  onChange={e => updatePrinter(printer.id, 'location_id', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #e5e5e5', color: '#1A1A1A', backgroundColor: '#fff' }}>
                  <option value="">Select location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-sm mb-1 block" style={{ color: '#555' }}>IP Address</label>
                  <input
                    value={printer.ip_address}
                    onChange={e => updatePrinter(printer.id, 'ip_address', e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-mono"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                </div>
                <div>
                  <label className="text-sm mb-1 block" style={{ color: '#555' }}>Port</label>
                  <input
                    value={printer.port}
                    onChange={e => updatePrinter(printer.id, 'port', parseInt(e.target.value) || 9100)}
                    placeholder="9100"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none font-mono"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => savePrinter(printer)}
              disabled={saving === printer.id}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
              <Save size={14} />
              {saving === printer.id ? 'Saving...' : 'Save Printer'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

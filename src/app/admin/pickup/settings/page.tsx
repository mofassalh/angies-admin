'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Save } from 'lucide-react'

export default function PickupSettingsPage() {
  const [settings, setSettings] = useState({
    pickup_enabled: 'true',
    pickup_time_min: '15',
    pickup_time_max: '20',
    pickup_instructions: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('settings').select('*')
      if (data) {
        const map: any = {}
        data.forEach((r: any) => { map[r.key] = r.value })
        setSettings(s => ({
          ...s,
          pickup_enabled: map.pickup_enabled || 'true',
          pickup_time_min: map.pickup_time_min || '15',
          pickup_time_max: map.pickup_time_max || '20',
          pickup_instructions: map.pickup_instructions || '',
        }))
      }
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Pickup Settings</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Configure pickup options</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: saved ? '#22c55e' : '#F5C800', color: saved ? 'white' : '#1A1A1A' }}>
          <Save size={15} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-lg space-y-4">

        {/* Enable/Disable */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Enable Pickup</div>
              <div className="text-xs mt-0.5" style={{ color: '#888' }}>Allow customers to place pickup orders</div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, pickup_enabled: s.pickup_enabled === 'true' ? 'false' : 'true' }))}
              className="relative w-12 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.pickup_enabled === 'true' ? '#22c55e' : '#e5e5e5' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: settings.pickup_enabled === 'true' ? '26px' : '4px' }} />
            </button>
          </div>
        </div>

        {/* Time estimate */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Pickup Time Estimate</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'pickup_time_min', label: 'Min (mins)' },
              { key: 'pickup_time_max', label: 'Max (mins)' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>{field.label}</label>
                <div className="flex items-center">
                  <input type="number"
                    value={(settings as any)[field.key]}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    className="flex-1 px-3 py-2.5 rounded-l-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', borderRight: 'none', color: '#1A1A1A' }} />
                  <span className="px-3 py-2.5 rounded-r-xl text-sm" style={{ background: '#f5f5f5', border: '1px solid #e5e5e5', borderLeft: 'none', color: '#888' }}>min</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: '#aaa' }}>
            Shown to customers as: {settings.pickup_time_min}–{settings.pickup_time_max} minutes
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="font-semibold text-sm mb-3" style={{ color: '#1A1A1A' }}>Pickup Instructions</div>
          <textarea value={settings.pickup_instructions}
            onChange={e => setSettings(s => ({ ...s, pickup_instructions: e.target.value }))}
            placeholder="e.g. Please come to the front counter and quote your order number."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          <p className="text-xs mt-1" style={{ color: '#aaa' }}>Shown to customers on order confirmation page</p>
        </div>

      </div>
    </div>
  )
}

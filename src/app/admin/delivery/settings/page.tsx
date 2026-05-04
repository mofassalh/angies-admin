'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Save } from 'lucide-react'

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState({
    delivery_enabled: 'true',
    delivery_fee: '5.00',
    min_order_delivery: '15.00',
    delivery_time_min: '30',
    delivery_time_max: '45',
    free_delivery_above: '',
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
          delivery_enabled: map.delivery_enabled || 'true',
          delivery_fee: map.delivery_fee || '5.00',
          min_order_delivery: map.min_order_delivery || '15.00',
          delivery_time_min: map.delivery_time_min || '30',
          delivery_time_max: map.delivery_time_max || '45',
          free_delivery_above: map.free_delivery_above || '',
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
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Delivery Settings</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Configure delivery options</p>
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
              <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Enable Delivery</div>
              <div className="text-xs mt-0.5" style={{ color: '#888' }}>Allow customers to place delivery orders</div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, delivery_enabled: s.delivery_enabled === 'true' ? 'false' : 'true' }))}
              className="relative w-12 h-6 rounded-full transition-all"
              style={{ backgroundColor: settings.delivery_enabled === 'true' ? '#22c55e' : '#e5e5e5' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: settings.delivery_enabled === 'true' ? '26px' : '4px' }} />
            </button>
          </div>
        </div>

        {/* Fee settings */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Fees & Minimums</div>
          <div className="space-y-3">
            {[
              { key: 'delivery_fee', label: 'Delivery Fee ($)', placeholder: '5.00' },
              { key: 'min_order_delivery', label: 'Minimum Order ($)', placeholder: '15.00' },
              { key: 'free_delivery_above', label: 'Free Delivery Above ($)', placeholder: 'e.g. 50 (leave blank to disable)' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>{field.label}</label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-xl text-sm" style={{ background: '#f5f5f5', border: '1px solid #e5e5e5', borderRight: 'none', color: '#888' }}>$</span>
                  <input type="number" step="0.50"
                    value={(settings as any)[field.key]}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 px-3 py-2.5 rounded-r-xl text-sm outline-none"
                    style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time estimate */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Delivery Time Estimate</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'delivery_time_min', label: 'Min (mins)' },
              { key: 'delivery_time_max', label: 'Max (mins)' },
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
            Shown to customers as: {settings.delivery_time_min}–{settings.delivery_time_max} minutes
          </p>
        </div>

      </div>
    </div>
  )
}

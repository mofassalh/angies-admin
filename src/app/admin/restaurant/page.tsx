'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Save, Clock, MapPin, Phone, Mail, Globe, Toggle } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_HOURS = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { open: '11:00', close: '22:00', closed: false }
}), {} as Record<string, { open: string, close: string, closed: boolean }>)

export default function RestaurantPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLoc, setSelectedLoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [storeOpen, setStoreOpen] = useState(true)
  const [hours, setHours] = useState<Record<string, any>>(DEFAULT_HOURS)
  const [minOrder, setMinOrder] = useState('0')
  const [deliveryFee, setDeliveryFee] = useState('0')
  const [deliveryTime, setDeliveryTime] = useState('30')
  const [pickupTime, setPickupTime] = useState('15')
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('locations').select('*').eq('is_active', true).order('name')
      if (data && data.length > 0) {
        setLocations(data)
        setSelectedLoc(data[0])
        loadLocationSettings(data[0])
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const loadLocationSettings = (loc: any) => {
    setStoreOpen(loc.is_open ?? true)
    setHours(loc.opening_hours ? JSON.parse(loc.opening_hours) : DEFAULT_HOURS)
    setMinOrder(loc.min_order || '0')
    setDeliveryFee(loc.delivery_fee || '0')
    setDeliveryTime(loc.delivery_time || '30')
    setPickupTime(loc.pickup_time || '15')
  }

  const handleSave = async () => {
    if (!selectedLoc) return
    setSaving(true)
    await supabase.from('locations').update({
      is_open: storeOpen,
      opening_hours: JSON.stringify(hours),
      min_order: minOrder,
      delivery_fee: deliveryFee,
      delivery_time: deliveryTime,
      pickup_time: pickupTime,
    }).eq('id', selectedLoc.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateHours = (day: string, field: string, value: any) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
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
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Restaurant</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage store settings & opening hours</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: saved ? '#22c55e' : '#F5C800', color: saved ? 'white' : '#1A1A1A' }}>
          <Save size={15} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Location tabs */}
      {locations.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {locations.map(loc => (
            <button key={loc.id}
              onClick={() => { setSelectedLoc(loc); loadLocationSettings(loc) }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: selectedLoc?.id === loc.id ? '#1A1A1A' : 'white',
                color: selectedLoc?.id === loc.id ? 'white' : '#666',
                border: '1px solid #e5e5e5',
              }}>
              <MapPin size={12} className="inline mr-1.5" style={{ color: selectedLoc?.id === loc.id ? '#F5C800' : '#aaa' }} />
              {loc.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column */}
        <div className="space-y-4">

          {/* Store status */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Store Status</div>
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: storeOpen ? '#f0fdf4' : '#fef2f2', border: `1px solid ${storeOpen ? '#86efac' : '#fca5a5'}` }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: storeOpen ? '#15803d' : '#dc2626' }}>
                  {storeOpen ? '🟢 Store Open' : '🔴 Store Closed'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: storeOpen ? '#86efac' : '#fca5a5' }}>
                  {storeOpen ? 'Accepting orders' : 'Not accepting orders'}
                </div>
              </div>
              <button onClick={() => setStoreOpen(!storeOpen)}
                className="relative w-12 h-6 rounded-full transition-all"
                style={{ backgroundColor: storeOpen ? '#22c55e' : '#e5e5e5' }}>
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow"
                  style={{ left: storeOpen ? '26px' : '4px' }} />
              </button>
            </div>
          </div>

          {/* Order settings */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Order Settings</div>
            <div className="space-y-3">
              {[
                { label: 'Min Order Amount ($)', value: minOrder, setter: setMinOrder, prefix: '$' },
                { label: 'Delivery Fee ($)', value: deliveryFee, setter: setDeliveryFee, prefix: '$' },
                { label: 'Delivery Time (mins)', value: deliveryTime, setter: setDeliveryTime, suffix: 'min' },
                { label: 'Pickup Time (mins)', value: pickupTime, setter: setPickupTime, suffix: 'min' },
              ].map(({ label, value, setter, prefix, suffix }) => (
                <div key={label}>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>{label}</label>
                  <div className="flex items-center">
                    {prefix && <span className="px-3 py-2.5 rounded-l-xl text-sm font-medium" style={{ background: '#f5f5f5', border: '1px solid #e5e5e5', borderRight: 'none', color: '#888' }}>{prefix}</span>}
                    <input type="number" value={value}
                      onChange={e => setter(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm outline-none"
                      style={{
                        border: '1px solid #e5e5e5',
                        borderRadius: prefix ? '0 12px 12px 0' : suffix ? '12px 0 0 12px' : '12px',
                        color: '#1A1A1A',
                      }} />
                    {suffix && <span className="px-3 py-2.5 rounded-r-xl text-sm font-medium" style={{ background: '#f5f5f5', border: '1px solid #e5e5e5', borderLeft: 'none', color: '#888' }}>{suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right — Opening hours */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} style={{ color: '#F5C800' }} />
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Opening Hours</div>
          </div>
          <div className="space-y-3">
            {DAYS.map(day => {
              const h = hours[day] || { open: '11:00', close: '22:00', closed: false }
              return (
                <div key={day} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: h.closed ? '#fafafa' : '#fffdf0', border: '0.5px solid #f0f0f0' }}>
                  <div className="w-28 text-sm font-medium" style={{ color: h.closed ? '#bbb' : '#1A1A1A' }}>{day}</div>
                  {h.closed ? (
                    <div className="flex-1 text-sm" style={{ color: '#bbb' }}>Closed</div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={h.open}
                        onChange={e => updateHours(day, 'open', e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                      <span className="text-xs" style={{ color: '#aaa' }}>to</span>
                      <input type="time" value={h.close}
                        onChange={e => updateHours(day, 'close', e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
                    </div>
                  )}
                  <button
                    onClick={() => updateHours(day, 'closed', !h.closed)}
                    className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                    style={{ backgroundColor: h.closed ? '#e5e5e5' : '#F5C800' }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                      style={{ left: h.closed ? '2px' : '18px' }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

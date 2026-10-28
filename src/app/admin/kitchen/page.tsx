'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { getStoreStatus } from '@/lib/storeHours'
import { toDate as utcDate } from '@/lib/adminFilters'

// Simple kitchen screen: New → Cooking → Ready.
// Tapping is optional — orders still show without any taps, and old
// orders drop off the screen after a few hours.

const ACTIVE = ['pending', 'confirmed', 'preparing', 'ready']
const STALE_HOURS = 3

const COLUMNS = [
  { key: 'new', label: 'New', statuses: ['pending', 'confirmed'], next: 'preparing', button: 'Start cooking', accent: '#F5C800', btnBg: '#F5C800', btnText: '#1A1A1A', chipBg: '#FFF8DB', chipText: '#8A6800' },
  { key: 'cooking', label: 'Cooking', statuses: ['preparing'], next: 'ready', button: 'Ready', accent: '#3B82F6', btnBg: '#3B82F6', btnText: '#FFFFFF', chipBg: '#EFF6FF', chipText: '#1D4ED8' },
  { key: 'ready', label: 'Ready', statuses: ['ready'], next: 'completed', button: 'Picked up', accent: '#22C55E', btnBg: '#16A34A', btnText: '#FFFFFF', chipBg: '#F0FDF4', chipText: '#15803D' },
]

function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const play = (freq: number, start: number) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.25, ctx.currentTime + start)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.35)
      o.start(ctx.currentTime + start)
      o.stop(ctx.currentTime + start + 0.4)
    }
    play(880, 0)
    play(1175, 0.4)
    play(880, 0.8)
  } catch {}
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [soundOn, setSoundOn] = useState(false)
  const seenIds = useRef<Set<string> | null>(null)
  const soundRef = useRef(false)
  const supabase = createClient()

  const load = async () => {
    const since = new Date(Date.now() - STALE_HOURS * 3600 * 1000).toISOString()
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .in('status', ACTIVE)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
    const list = data || []
    // Sound for orders we haven't seen before
    if (seenIds.current) {
      const fresh = list.some(o => !seenIds.current!.has(o.id) && (o.status === 'pending' || o.status === 'confirmed'))
      if (fresh && soundRef.current) beep()
    }
    seenIds.current = new Set(list.map(o => o.id))
    setOrders(list)
  }

  useEffect(() => {
    // Close orders left open for more than 3 hours so nothing stays stuck as "New"
    const closeStale = () => { supabase.rpc('close_stale_orders').then(() => {}, () => {}) }
    closeStale()
    const staleTimer = setInterval(closeStale, 10 * 60 * 1000)
    load()
    supabase.from('locations').select('id, name, is_open, opening_hours').eq('restaurant_id', RESTAURANT_ID).eq('is_active', true)
      .then(({ data }) => setLocations(data || []))
    const channel = supabase
      .channel('kitchen-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    const poll = setInterval(load, 30000) // backup in case realtime drops
    const timer = setInterval(() => setNow(new Date()), 15000)
    try {
      const saved = localStorage.getItem('selectedLocation')
      if (saved) setSelectedLocation(saved)
      if (localStorage.getItem('kitchenSound') === 'on') { setSoundOn(true); soundRef.current = true }
    } catch {}
    const onStorage = () => {
      try { setSelectedLocation(localStorage.getItem('selectedLocation') || 'All Locations') } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => { supabase.removeChannel(channel); clearInterval(poll); clearInterval(staleTimer); clearInterval(timer); window.removeEventListener('storage', onStorage) }
  }, [])

  const toggleSound = () => {
    const v = !soundOn
    setSoundOn(v)
    soundRef.current = v
    try { localStorage.setItem('kitchenSound', v ? 'on' : 'off') } catch {}
    if (v) beep()
  }

  const visible = selectedLocation === 'All Locations' ? orders : orders.filter(o => o.location === selectedLocation)

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await supabase.from('orders').update({ status }).eq('id', id)
    await load()
    setUpdatingId(null)
  }

  const minsAgo = (createdAt: string) => Math.max(0, Math.floor((now.getTime() - utcDate(createdAt).getTime()) / 60000))
  const timeChip = (m: number) =>
    m < 10 ? { bg: '#F0FDF4', text: '#15803D' } : m < 20 ? { bg: '#FFFBEB', text: '#B45309' } : { bg: '#FEF2F2', text: '#B91C1C' }

  // Store status for the header
  const storeLabel = (() => {
    if (selectedLocation === 'All Locations') {
      const openCount = locations.filter(l => getStoreStatus(l).open).length
      return { text: `${openCount} of ${locations.length} stores open`, open: openCount > 0 }
    }
    const loc = locations.find(l => l.name === selectedLocation)
    if (!loc) return null
    const st = getStoreStatus(loc)
    return { text: st.open ? 'Open · taking orders' : st.message, open: st.open }
  })()

  const shortName = selectedLocation === 'All Locations' ? 'All stores' : selectedLocation.replace(/^Angie's Kebabs & Burgers\s*-\s*/, '')

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F5', color: '#1A1A1A' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-white" style={{ borderBottom: '1px solid #EBEBEB' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: '#F5C800', color: '#1A1A1A' }}>A</div>
          <div>
            <div className="font-bold text-lg">Kitchen · {shortName}</div>
            <div className="text-sm" style={{ color: '#777' }}>{visible.length} active {visible.length === 1 ? 'order' : 'orders'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {storeLabel && (
            <span className="text-sm font-medium px-3 py-1.5 rounded-full"
              style={{ background: storeLabel.open ? '#F0FDF4' : '#FEF2F2', color: storeLabel.open ? '#15803D' : '#B91C1C' }}>
              {storeLabel.text}
            </span>
          )}
          <button onClick={toggleSound}
            className="text-sm font-medium px-3 py-1.5 rounded-full"
            style={{ background: soundOn ? '#FFF8DB' : '#FFFFFF', color: soundOn ? '#8A6800' : '#555', border: `1px solid ${soundOn ? '#F5C800' : '#E5E5E5'}` }}>
            {soundOn ? '🔔 Sound on' : '🔕 Turn sound on'}
          </button>
          <div className="text-2xl font-bold tabular-nums">
            {now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height: '60vh' }}>
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <div className="text-2xl font-bold">All clear</div>
            <div className="text-base mt-2" style={{ color: '#777' }}>New orders will appear here{soundOn ? ' with a sound' : ''}.</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {COLUMNS.map(col => {
            const list = visible.filter(o => col.statuses.includes(o.status))
            return (
              <div key={col.key}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-bold text-lg">{col.label}</span>
                  <span className="text-sm font-bold px-3 py-0.5 rounded-full" style={{ background: col.chipBg, color: col.chipText }}>{list.length}</span>
                </div>
                <div className="space-y-3">
                  {list.length === 0 && (
                    <div className="text-center py-10 text-sm rounded-2xl" style={{ color: '#AAA', border: '1px dashed #DDD' }}>No orders</div>
                  )}
                  {list.map(order => {
                    const m = minsAgo(order.created_at)
                    const chip = timeChip(m)
                    return (
                      <div key={order.id} className="bg-white rounded-2xl p-4"
                        style={{ border: col.key === 'new' ? `2px solid ${col.accent}` : '1px solid #EBEBEB' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">{order.order_number}</span>
                          <span className="text-sm font-semibold px-2.5 py-1 rounded-full" style={{ background: chip.bg, color: chip.text }}>
                            {m === 0 ? 'Just now' : `${m} min`}
                          </span>
                        </div>
                        <div className="text-sm mt-1 mb-3" style={{ color: '#666' }}>
                          {order.customer_name || 'Customer'} · {order.order_type === 'delivery' ? '🛵 Delivery' : '🏃 Pickup'}
                          {selectedLocation === 'All Locations' && order.location && (
                            <> · {String(order.location).replace(/^Angie's Kebabs & Burgers\s*-\s*/, '')}</>
                          )}
                        </div>

                        <div className="space-y-2">
                          {(order.items || []).map((item: any, i: number) => (
                            <div key={i}>
                              <div className="text-base font-semibold">
                                <span style={{ color: '#B08900' }}>{item.quantity} ×</span> {item.name}
                              </div>
                              {item.selectedOptions?.length > 0 && (
                                <div className="text-sm ml-7" style={{ color: '#666' }}>
                                  {item.selectedOptions.map((o: any) => o.optionName || o.name).filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="text-sm p-2.5 rounded-xl mt-3" style={{ background: '#FFFBEB', color: '#92400E' }}>
                            ⚠️ {order.notes}
                          </div>
                        )}

                        <button
                          onClick={() => updateStatus(order.id, col.next)}
                          disabled={updatingId === order.id}
                          className="w-full mt-4 rounded-xl text-base font-bold transition-all disabled:opacity-50"
                          style={{ background: col.btnBg, color: col.btnText, height: 52 }}>
                          {updatingId === order.id ? '…' : col.button}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

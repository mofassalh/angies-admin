'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Eye, X, Bell, MapPin } from 'lucide-react'

type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_address: string
  order_type: string
  location: string
  items: any[]
  total: number
  status: string
  notes: string
  created_at: string
}

const STATUS_COLORS: any = {
  pending: { bg: '#fff8e1', text: '#b8860b' },
  confirmed: { bg: '#e3f2fd', text: '#1565c0' },
  preparing: { bg: '#fff3e0', text: '#e65100' },
  ready: { bg: '#e8f5e9', text: '#2e7d32' },
  completed: { bg: '#f3e5f5', text: '#6a1b9a' },
  cancelled: { bg: '#ffebee', text: '#c62828' },
}

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLocations, setFilterLocations] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const supabase = createClient()

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    const allOrders = data || []
    setOrders(allOrders)
    const locs = [...new Set(allOrders.map((o: Order) => o.location).filter(Boolean))] as string[]
    setLocations(locs)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order
          setOrders(prev => [newOrder, ...prev])
          setLocations(prev => newOrder.location && !prev.includes(newOrder.location) ? [...prev, newOrder.location] : prev)
          setNewOrderIds(prev => new Set([...prev, newOrder.id]))
          setNewOrderAlert(newOrder.customer_name || 'New order')
          setTimeout(() => {
            setNewOrderIds(prev => { const s = new Set(prev); s.delete(newOrder.id); return s })
          }, 5000)
          setTimeout(() => setNewOrderAlert(null), 4000)
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
          setSelected(prev => prev?.id === updated.id ? updated : prev)
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleLocation = (loc: string) => {
    setFilterLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    )
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(true)
    await supabase.from('orders').update({ status }).eq('id', id)
    // Immediately update local state
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
    setUpdatingStatus(false)
    setSelected(null)
  }

  const filtered = orders.filter(o => {
    const statusMatch = filterStatus === 'all' || o.status === filterStatus
    const locationMatch = filterLocations.length === 0 || filterLocations.includes(o.location)
    return statusMatch && locationMatch
  })

  const formatDate = (d: string) => new Date(d).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div>
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Bell size={18} />
          <span className="font-semibold text-sm">New order from {newOrderAlert}!</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Orders</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{filtered.length} of {orders.length} orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: '#22c55e' }}></span>
          <span className="text-xs" style={{ color: '#888' }}>Live</span>
        </div>
      </div>

      {locations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} style={{ color: '#888' }} />
            <span className="text-xs font-medium" style={{ color: '#888' }}>Filter by Location</span>
            {filterLocations.length > 0 && (
              <button onClick={() => setFilterLocations([])} className="text-xs underline" style={{ color: '#F5C800' }}>
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {locations.map(loc => (
              <button key={loc} onClick={() => toggleLocation(loc)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: filterLocations.includes(loc) ? '#F5C800' : '#fff',
                  color: filterLocations.includes(loc) ? '#1A1A1A' : '#666',
                  border: filterLocations.includes(loc) ? '1px solid #F5C800' : '1px solid #e5e5e5',
                }}>
                {filterLocations.includes(loc) ? '✓ ' : ''}{loc}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-3 py-1 rounded-full text-sm font-medium capitalize"
            style={{
              backgroundColor: filterStatus === s ? '#1A1A1A' : '#fff',
              color: filterStatus === s ? '#fff' : '#666',
              border: '1px solid #e5e5e5'
            }}>
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        {loading ? (
          <p className="p-6 text-sm" style={{ color: '#aaa' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm" style={{ color: '#aaa' }}>No orders found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>#</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Customer</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Location</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Type</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Total</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Status</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Date</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => {
                const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
                const isNew = newOrderIds.has(order.id)
                return (
                  <tr key={order.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: isNew ? '#fffde7' : 'transparent',
                      transition: 'background-color 1s'
                    }}>
                    <td className="px-6 py-4 font-mono text-xs" style={{ color: '#888' }}>
                      {order.order_number || '#' + order.id.slice(0, 6)}
                      {isNew && <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>NEW</span>}
                    </td>
                    <td className="px-6 py-4" style={{ color: '#1A1A1A' }}>
                      <div className="font-medium">{order.customer_name || '—'}</div>
                      {order.customer_phone && <div className="text-xs" style={{ color: '#aaa' }}>{order.customer_phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium" style={{ color: '#555' }}>{order.location || '—'}</td>
                    <td className="px-6 py-4 capitalize text-xs" style={{ color: '#555' }}>{order.order_type || '—'}</td>
                    <td className="px-6 py-4 font-semibold" style={{ color: '#1A1A1A' }}>${parseFloat(String(order.total)).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                        style={{ backgroundColor: sc.bg, color: sc.text }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: '#888' }}>{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelected(order)}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: '#f5f5f5', color: '#555' }}>
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                Order {selected.order_number || '#' + selected.id.slice(0, 6)}
              </h3>
              <button onClick={() => setSelected(null)} style={{ color: '#aaa' }}><X size={20} /></button>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#f9f9f9' }}>
              <h4 className="font-semibold text-sm mb-2" style={{ color: '#1A1A1A' }}>Customer</h4>
              <p className="text-sm" style={{ color: '#555' }}>{selected.customer_name || '—'}</p>
              <p className="text-sm" style={{ color: '#555' }}>{selected.customer_phone || '—'}</p>
              {selected.customer_address && <p className="text-sm" style={{ color: '#555' }}>{selected.customer_address}</p>}
              <p className="text-sm capitalize mt-1" style={{ color: '#888' }}>Type: {selected.order_type}</p>
              {selected.location && <p className="text-sm" style={{ color: '#888' }}>Location: {selected.location}</p>}
              {selected.notes && <p className="text-sm mt-1 italic" style={{ color: '#aaa' }}>Note: {selected.notes}</p>}
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#f9f9f9' }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#1A1A1A' }}>Items</h4>
              {Array.isArray(selected.items) && selected.items.length > 0 ? (
                selected.items.map((item: any, i: number) => (
                  <div key={i} className="py-2" style={{ borderBottom: i < selected.items.length - 1 ? '1px solid #eee' : 'none' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#333' }}>{item.name} x{item.quantity || 1}</span>
                      <span style={{ color: '#1A1A1A' }}>${parseFloat(String(item.lineTotal || item.price)).toFixed(2)}</span>
                    </div>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="text-xs mt-1 ml-2" style={{ color: '#888' }}>
                        {item.selectedOptions.map((o: any) => o.optionName).join(', ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: '#aaa' }}>No items</p>
              )}
              <div className="flex justify-between font-bold text-sm mt-3 pt-3"
                style={{ borderTop: '1px solid #e5e5e5' }}>
                <span>Total</span>
                <span style={{ color: '#F5C800' }}>${parseFloat(String(selected.total)).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#1A1A1A' }}>Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => {
                  const sc = STATUS_COLORS[s]
                  return (
                    <button key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={updatingStatus || selected.status === s}
                      className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: selected.status === s ? sc.bg : '#f5f5f5',
                        color: selected.status === s ? sc.text : '#555',
                        border: selected.status === s ? `1px solid ${sc.text}` : '1px solid #e5e5e5',
                        fontWeight: selected.status === s ? 700 : 400
                      }}>
                      {updatingStatus && selected.status !== s ? '...' : s}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Eye, X, Bell, MapPin, Clock, ChevronDown } from 'lucide-react'

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
  payment_status: string
  payment_method: string
  created_at: string
  expected_at: string
}

const STATUS_COLORS: any = {
  pending:   { bg: '#fff8e1', text: '#b8860b', border: '#f5c800' },
  confirmed: { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  preparing: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
  ready:     { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' },
  completed: { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
  cancelled: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
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
  const [dateFilter, setDateFilter] = useState('today')
  const supabase = createClient()

  const fetchOrders = async () => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (dateFilter === 'today') {
      const today = new Date(); today.setHours(0,0,0,0)
      query = query.gte('created_at', today.toISOString())
    } else if (dateFilter === '7days') {
      const d = new Date(); d.setDate(d.getDate() - 7)
      query = query.gte('created_at', d.toISOString())
    }
    const { data } = await query
    const allOrders = data || []
    setOrders(allOrders)
    const locs = [...new Set(allOrders.map((o: Order) => o.location).filter(Boolean))] as string[]
    setLocations(locs)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [dateFilter])

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order
          setOrders(prev => [newOrder, ...prev])
          setLocations(prev => newOrder.location && !prev.includes(newOrder.location) ? [...prev, newOrder.location] : prev)
          setNewOrderIds(prev => new Set([...prev, newOrder.id]))
          setNewOrderAlert(newOrder.customer_name || 'New order')
          setTimeout(() => { setNewOrderIds(prev => { const s = new Set(prev); s.delete(newOrder.id); return s }) }, 5000)
          setTimeout(() => setNewOrderAlert(null), 4000)
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
          setSelected(prev => prev?.id === updated.id ? updated : prev)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(true)
    await supabase.from('orders').update({ status }).eq('id', id)
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

  const totalRevenue = filtered.reduce((s, o) => s + (parseFloat(String(o.total)) || 0), 0)
  const avgOrder = filtered.length > 0 ? totalRevenue / filtered.length : 0

  return (
    <div>
      {/* New order toast */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl animate-bounce"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Bell size={18} />
          <span className="font-semibold text-sm">New order from {newOrderAlert}!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Realtime Orders</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{filtered.length} of {orders.length} orders</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date filter */}
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl outline-none"
            style={{ border: '1px solid #e5e5e5', color: '#1A1A1A', background: 'white' }}>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }}></span>
            <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Live</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sales', value: `$${totalRevenue.toFixed(2)}` },
          { label: 'Average Order', value: `$${avgOrder.toFixed(2)}` },
          { label: 'Total Orders', value: filtered.length.toString() },
          { label: 'Pending', value: filtered.filter(o => o.status === 'pending').length.toString() },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e5e5e5' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#888' }}>{card.label}</div>
            <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Location filter */}
      {locations.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <MapPin size={14} style={{ color: '#888' }} />
          <span className="text-xs font-medium" style={{ color: '#888' }}>Location:</span>
          {locations.map(loc => (
            <button key={loc} onClick={() => setFilterLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: filterLocations.includes(loc) ? '#F5C800' : 'white',
                color: filterLocations.includes(loc) ? '#1A1A1A' : '#666',
                border: `1px solid ${filterLocations.includes(loc) ? '#F5C800' : '#e5e5e5'}`,
              }}>
              {filterLocations.includes(loc) ? '✓ ' : ''}{loc}
            </button>
          ))}
          {filterLocations.length > 0 && (
            <button onClick={() => setFilterLocations([])} className="text-xs underline" style={{ color: '#aaa' }}>Clear</button>
          )}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all"
            style={{
              backgroundColor: filterStatus === s ? '#1A1A1A' : 'white',
              color: filterStatus === s ? '#fff' : '#666',
              border: '1px solid #e5e5e5',
            }}>
            {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm" style={{ color: '#aaa' }}>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                  {['#', 'Customer', 'Order Address', 'Type', 'Order Spend', 'Status', 'Order Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
                  const isNew = newOrderIds.has(order.id)
                  return (
                    <tr key={order.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(order)}
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid #f0f0f0' : 'none',
                        backgroundColor: isNew ? '#fffde7' : '',
                      }}>
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: '#888' }}>
                        <div>{order.order_number || '#' + order.id.slice(0, 5)}</div>
                        {isNew && <span className="px-1.5 py-0.5 rounded text-xs font-bold mt-1 inline-block" style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>NEW</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{order.customer_name || '—'}</div>
                        {order.customer_phone && <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>{order.customer_phone}</div>}
                      </td>
                      <td className="px-5 py-4 text-xs max-w-48" style={{ color: '#555' }}>
                        {order.order_type === 'delivery' && order.customer_address
                          ? <div className="truncate">{order.customer_address}</div>
                          : <div style={{ color: '#aaa' }}>{order.location || '—'}</div>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: order.order_type === 'delivery' ? '#e3f2fd' : '#e8f5e9',
                            color: order.order_type === 'delivery' ? '#1565c0' : '#2e7d32',
                          }}>
                          {order.order_type === 'delivery' ? '🛵 Delivery' : '🏃 Pickup'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#1A1A1A' }}>
                        ${parseFloat(String(order.total)).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                          style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: '#888' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={e => { e.stopPropagation(); setSelected(order) }}
                          className="p-2 rounded-lg transition-all hover:bg-gray-100"
                          style={{ color: '#555' }}>
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                  Order {selected.order_number || '#' + selected.id.slice(0, 5)}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>{formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: '#aaa' }}><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer */}
              <div className="rounded-xl p-4" style={{ background: '#f9f9f9' }}>
                <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#888' }}>Customer</div>
                <div className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{selected.customer_name || '—'}</div>
                {selected.customer_phone && <div className="text-sm mt-1" style={{ color: '#555' }}>{selected.customer_phone}</div>}
                {selected.customer_address && (
                  <div className="text-sm mt-1 flex items-start gap-1" style={{ color: '#555' }}>
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#F5C800' }} />
                    {selected.customer_address}
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <span className="text-xs capitalize px-2 py-1 rounded-full"
                    style={{ background: selected.order_type === 'delivery' ? '#e3f2fd' : '#e8f5e9', color: selected.order_type === 'delivery' ? '#1565c0' : '#2e7d32' }}>
                    {selected.order_type === 'delivery' ? '🛵 Delivery' : '🏃 Pickup'}
                  </span>
                  {selected.location && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#f5f5f5', color: '#555' }}>
                      📍 {selected.location}
                    </span>
                  )}
                </div>
                {selected.notes && <p className="text-xs mt-2 italic" style={{ color: '#aaa' }}>Note: {selected.notes}</p>}
              </div>

              {/* Items */}
              <div className="rounded-xl p-4" style={{ background: '#f9f9f9' }}>
                <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#888' }}>Items</div>
                {Array.isArray(selected.items) && selected.items.length > 0 ? (
                  <div className="space-y-2">
                    {selected.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>
                          <span style={{ color: '#333' }}>{item.name}</span>
                          <span className="ml-1 text-xs" style={{ color: '#aaa' }}>x{item.quantity || 1}</span>
                          {item.selectedOptions?.length > 0 && (
                            <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>
                              {item.selectedOptions.map((o: any) => o.optionName).join(', ')}
                            </div>
                          )}
                        </div>
                        <span className="font-medium" style={{ color: '#1A1A1A' }}>
                          ${parseFloat(String(item.lineTotal || item.price)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm" style={{ color: '#aaa' }}>No items</p>}
                <div className="flex justify-between font-bold text-sm mt-4 pt-3" style={{ borderTop: '1px solid #e5e5e5' }}>
                  <span>Total</span>
                  <span style={{ color: '#F5C800' }}>${parseFloat(String(selected.total)).toFixed(2)}</span>
                </div>
              </div>

              {/* Update status */}
              <div>
                <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#888' }}>Update Status</div>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map(s => {
                    const sc = STATUS_COLORS[s]
                    const isActive = selected.status === s
                    return (
                      <button key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={updatingStatus || isActive}
                        className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all disabled:opacity-60"
                        style={{
                          backgroundColor: isActive ? sc.bg : '#f5f5f5',
                          color: isActive ? sc.text : '#555',
                          border: isActive ? `1.5px solid ${sc.border}` : '1px solid #e5e5e5',
                        }}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

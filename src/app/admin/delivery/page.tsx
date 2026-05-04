'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Truck, Clock, DollarSign, MapPin, ExternalLink } from 'lucide-react'

const STATUS_COLORS: any = {
  pending:   { bg: '#fff8e1', text: '#b8860b' },
  confirmed: { bg: '#e3f2fd', text: '#1565c0' },
  preparing: { bg: '#fff3e0', text: '#e65100' },
  ready:     { bg: '#e8f5e9', text: '#2e7d32' },
  completed: { bg: '#f3e5f5', text: '#6a1b9a' },
  cancelled: { bg: '#ffebee', text: '#c62828' },
}

export default function DeliveryPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'delivery')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('delivery-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetch())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await supabase.from('orders').update({ status }).eq('id', id)
    await fetch()
    setUpdatingId(null)
  }

  const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const completed = orders.filter(o => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + (parseFloat(o.total) || 0), 0)

  const formatDate = (d: string) => new Date(d).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Delivery</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage delivery orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }}></span>
          <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Live</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Deliveries', value: active.length, icon: Truck, color: '#4a9eff' },
          { label: 'Total Deliveries', value: orders.length, icon: MapPin, color: '#F5C800' },
          { label: 'Completed Today', value: completed.filter(o => new Date(o.created_at) >= new Date(new Date().setHours(0,0,0,0))).length, icon: Clock, color: '#22c55e' },
          { label: 'Delivery Revenue', value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign, color: '#a855f7' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: '#888' }}>{k.label}</span>
              <k.icon size={18} style={{ color: k.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{loading ? '—' : k.value}</div>
          </div>
        ))}
      </div>

      {/* Active Deliveries */}
      <div className="mb-4">
        <div className="font-semibold text-sm mb-3" style={{ color: '#1A1A1A' }}>
          Active Deliveries ({active.length})
        </div>
        {active.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #e5e5e5' }}>
            <div className="text-4xl mb-3">🛵</div>
            <p className="text-sm" style={{ color: '#aaa' }}>No active deliveries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(order => {
              const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
              return (
                <div key={order.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs" style={{ color: '#aaa' }}>{order.order_number}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                          style={{ background: sc.bg, color: sc.text }}>{order.status}</span>
                      </div>
                      <div className="font-semibold text-sm mb-1" style={{ color: '#1A1A1A' }}>
                        {order.customer_name || '—'}
                      </div>
                      {order.customer_address && (
                        <div className="flex items-start gap-1.5 text-xs" style={{ color: '#888' }}>
                          <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#F5C800' }} />
                          {order.customer_address}
                        </div>
                      )}
                      {order.customer_phone && (
                        <div className="text-xs mt-1" style={{ color: '#aaa' }}>{order.customer_phone}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm mb-1" style={{ color: '#1A1A1A' }}>
                        ${parseFloat(order.total).toFixed(2)}
                      </div>
                      <div className="text-xs" style={{ color: '#aaa' }}>{formatDate(order.created_at)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {/* Status update buttons */}
                    {['confirmed', 'preparing', 'ready', 'completed'].map(s => {
                      if (s === order.status) return null
                      const sc2 = STATUS_COLORS[s]
                      return (
                        <button key={s} onClick={() => updateStatus(order.id, s)}
                          disabled={updatingId === order.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all disabled:opacity-50"
                          style={{ background: sc2.bg, color: sc2.text, border: `1px solid ${sc2.text}30` }}>
                          {updatingId === order.id ? '...' : `→ ${s}`}
                        </button>
                      )
                    })}

                    {/* Dispatch button — UI only for now */}
                    <div className="ml-auto flex gap-2">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ background: '#000', color: 'white' }}
                        onClick={() => alert('Uber Direct API coming soon!')}>
                        🚗 Dispatch Uber
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ background: '#FF3008', color: 'white' }}
                        onClick={() => alert('DoorDash Drive API coming soon!')}>
                        🛵 Dispatch DoorDash
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent completed */}
      {completed.length > 0 && (
        <div>
          <div className="font-semibold text-sm mb-3" style={{ color: '#1A1A1A' }}>
            Recent Completed ({completed.length})
          </div>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['#', 'Customer', 'Address', 'Total', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completed.slice(0, 10).map((order, i) => (
                  <tr key={order.id} style={{ borderBottom: i < Math.min(completed.length, 10)-1 ? '1px solid #f9f9f9' : 'none' }}>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: '#aaa' }}>{order.order_number}</td>
                    <td className="px-5 py-3 font-medium text-sm" style={{ color: '#1A1A1A' }}>{order.customer_name || '—'}</td>
                    <td className="px-5 py-3 text-xs max-w-48 truncate" style={{ color: '#888' }}>{order.customer_address || '—'}</td>
                    <td className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A1A' }}>${parseFloat(order.total).toFixed(2)}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#888' }}>{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready']

const STATUS_CONFIG: any = {
  pending:   { label: 'New Order', bg: '#fff8e1', border: '#F5C800', text: '#8A6800', next: 'confirmed', nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', bg: '#e3f2fd', border: '#4a9eff', text: '#1565c0', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing: { label: 'Preparing', bg: '#fff3e0', border: '#ff9800', text: '#e65100', next: 'ready', nextLabel: 'Mark Ready' },
  ready:     { label: 'Ready', bg: '#e8f5e9', border: '#22c55e', text: '#15803d', next: 'completed', nextLabel: 'Completed' },
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', STATUS_ORDER)
      .order('created_at', { ascending: true })
    setOrders(data || [])
  }

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel('kitchen-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetch())
      .subscribe()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => { supabase.removeChannel(channel); clearInterval(timer) }
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await supabase.from('orders').update({ status }).eq('id', id)
    await fetch()
    setUpdatingId(null)
  }

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000)
    if (diff < 1) return 'Just now'
    if (diff === 1) return '1 min ago'
    return `${diff} mins ago`
  }

  const getElapsedColor = (createdAt: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000)
    if (diff < 10) return '#22c55e'
    if (diff < 20) return '#f59e0b'
    return '#ef4444'
  }

  // Group by status
  const grouped = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="min-h-screen" style={{ background: '#111', color: 'white' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #222' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: '#F5C800', color: '#1A1A1A' }}>A</div>
          <div>
            <div className="font-bold text-white">Kitchen Display</div>
            <div className="text-xs" style={{ color: '#888' }}>{orders.length} active orders</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold text-white">
            {currentTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs" style={{ color: '#888' }}>
            {currentTime.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <div className="text-xl font-bold text-white">All Clear!</div>
            <div className="text-sm mt-2" style={{ color: '#888' }}>No active orders</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 h-full" style={{ minHeight: 'calc(100vh - 73px)' }}>
          {STATUS_ORDER.map(status => {
            const cfg = STATUS_CONFIG[status]
            const statusOrders = grouped[status] || []
            return (
              <div key={status} className="flex flex-col" style={{ borderRight: '1px solid #222' }}>
                {/* Column header */}
                <div className="px-4 py-3 flex items-center justify-between sticky top-0"
                  style={{ background: '#1a1a1a', borderBottom: '1px solid #222' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.border }} />
                    <span className="font-semibold text-sm text-white">{cfg.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: cfg.bg, color: cfg.text }}>{statusOrders.length}</span>
                </div>

                {/* Orders */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {statusOrders.length === 0 ? (
                    <div className="text-center py-8 text-xs" style={{ color: '#444' }}>No orders</div>
                  ) : (
                    statusOrders.map(order => (
                      <div key={order.id} className="rounded-2xl p-4"
                        style={{ background: '#1a1a1a', border: `1px solid ${cfg.border}40` }}>
                        {/* Order header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-sm" style={{ color: cfg.border }}>
                            {order.order_number}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: getElapsedColor(order.created_at) }}>
                            {getElapsed(order.created_at)}
                          </span>
                        </div>

                        <div className="font-semibold text-sm text-white mb-1">{order.customer_name || '—'}</div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: order.order_type === 'pickup' ? '#FFF9E0' : '#EFF6FF', color: order.order_type === 'pickup' ? '#8A6800' : '#1d4ed8' }}>
                            {order.order_type === 'pickup' ? '🏃 Pickup' : '🛵 Delivery'}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-1 mb-3">
                          {(order.items || []).map((item: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="font-bold mt-0.5" style={{ color: '#F5C800', minWidth: 16 }}>×{item.quantity}</span>
                              <div>
                                <div className="text-white">{item.name}</div>
                                {item.selectedOptions?.length > 0 && (
                                  <div style={{ color: '#888' }}>
                                    {item.selectedOptions.map((o: any) => o.optionName).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="text-xs p-2 rounded-lg mb-3 italic" style={{ background: '#2a2a2a', color: '#f59e0b' }}>
                            ⚠️ {order.notes}
                          </div>
                        )}

                        {/* Action button */}
                        {cfg.next && (
                          <button
                            onClick={() => updateStatus(order.id, cfg.next)}
                            disabled={updatingId === order.id}
                            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: cfg.border, color: status === 'pending' ? '#1A1A1A' : 'white' }}>
                            {updatingId === order.id ? '...' : cfg.nextLabel}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingBag, UtensilsCrossed, Users, TrendingUp, RefreshCw, MapPin } from 'lucide-react'

export default function AdminDashboard() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    menuItems: 0,
    staff: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''))
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalOrdersRes, todayOrdersRes, menuRes, staffRes, todayRevenueRes, totalRevenueRes, recentRes, locationsRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('available', true),
      supabase.from('staff').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total').gte('created_at', today.toISOString()),
      supabase.from('orders').select('total'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.from('locations').select('*').eq('is_active', true),
    ])

    const todayRevenue = todayRevenueRes.data?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0
    const totalRevenue = totalRevenueRes.data?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0

    setStats({
      totalOrders: totalOrdersRes.count || 0,
      todayOrders: todayOrdersRes.count || 0,
      menuItems: menuRes.count || 0,
      staff: staffRes.count || 0,
      todayRevenue,
      totalRevenue,
    })
    setRecentOrders(recentRes.data || [])
    setLocations(locationsRes.data || [])
    setLoading(false)
  }

  const statCards = [
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, sub: `Total: $${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: '#F5C800' },
    { label: "Today's Orders", value: stats.todayOrders, sub: `Total: ${stats.totalOrders}`, icon: ShoppingBag, color: '#4a9eff' },
    { label: 'Menu Items', value: stats.menuItems, sub: 'Active items', icon: UtensilsCrossed, color: '#22c55e' },
    { label: 'Staff Members', value: stats.staff, sub: 'All roles', icon: Users, color: '#a855f7' },
  ]

  const STATUS_COLORS: any = {
    pending: { bg: '#fff8e1', text: '#b8860b' },
    confirmed: { bg: '#e3f2fd', text: '#1565c0' },
    preparing: { bg: '#fff3e0', text: '#e65100' },
    ready: { bg: '#e8f5e9', text: '#2e7d32' },
    completed: { bg: '#f3e5f5', text: '#6a1b9a' },
    cancelled: { bg: '#ffebee', text: '#c62828' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Dashboard</h2>
          <p className="mt-1 text-sm" style={{ color: '#888' }}>Welcome back, {email}</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
          style={{ backgroundColor: '#f5f5f5', color: '#555' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-6"
            style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: '#888' }}>{label}</span>
              <Icon size={20} style={{ color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>{loading ? '—' : value}</p>
            <p className="text-xs mt-1" style={{ color: '#bbb' }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-6"
          style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm" style={{ color: '#bbb' }}>No orders yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <th className="text-left py-2 font-medium" style={{ color: '#888' }}>#</th>
                  <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Customer</th>
                  <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Total</th>
                  <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
                  return (
                    <tr key={order.id} style={{ borderBottom: i < recentOrders.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                      <td className="py-3 font-mono text-xs" style={{ color: '#aaa' }}>{order.order_number || '#' + order.id.slice(0,6)}</td>
                      <td className="py-3" style={{ color: '#333' }}>{order.customer_name || '—'}</td>
                      <td className="py-3 font-semibold" style={{ color: '#1A1A1A' }}>${parseFloat(order.total).toFixed(2)}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                          style={{ backgroundColor: sc.bg, color: sc.text }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl p-6"
          style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Active Locations</h3>
          {locations.length === 0 ? (
            <p className="text-sm" style={{ color: '#bbb' }}>No locations found</p>
          ) : (
            <div className="space-y-3">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: '#f9f9f9' }}>
                  <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: '#F5C800' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{loc.name}</div>
                    {loc.address && <div className="text-xs mt-0.5" style={{ color: '#888' }}>{loc.address}</div>}
                    {loc.hours && <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>{loc.hours}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

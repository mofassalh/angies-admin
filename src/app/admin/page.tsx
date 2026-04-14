'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingBag, UtensilsCrossed, Users, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState({
    orders: 0,
    menuItems: 0,
    staff: 0,
    todayRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''))
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [ordersRes, menuRes, staffRes, todayRes, recentRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }),
      supabase.from('staff').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total').gte('created_at', today.toISOString()),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    ])

    const todayRevenue = todayRes.data?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0

    setStats({
      orders: ordersRes.count || 0,
      menuItems: menuRes.count || 0,
      staff: staffRes.count || 0,
      todayRevenue,
    })
    setRecentOrders(recentRes.data || [])
  }

  const statCards = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: '#4a9eff' },
    { label: 'Menu Items', value: stats.menuItems, icon: UtensilsCrossed, color: '#22c55e' },
    { label: 'Staff Members', value: stats.staff, icon: Users, color: '#a855f7' },
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: TrendingUp, color: '#F5C800' },
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Dashboard</h2>
        <p className="mt-1 text-sm" style={{ color: '#888' }}>Welcome back, {email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-6"
            style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: '#888' }}>{label}</span>
              <Icon size={20} style={{ color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>{value}</p>
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
                      <td className="py-3 font-mono text-xs" style={{ color: '#aaa' }}>#{order.order_number || order.id.slice(0,6)}</td>
                      <td className="py-3" style={{ color: '#333' }}>{order.customer_name || '—'}</td>
                      <td className="py-3 font-semibold" style={{ color: '#1A1A1A' }}>${order.total}</td>
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
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Locations</h3>
          {['St Albans', 'Fitzroy North', 'Ascot Vale'].map(loc => (
            <div key={loc} className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#22c55e' }}></span>
              <span className="text-sm" style={{ color: '#444' }}>{loc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

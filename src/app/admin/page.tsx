'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingBag, UtensilsCrossed, Users, TrendingUp, RefreshCw, MapPin } from 'lucide-react'

export default function AdminDashboard() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [filterLocations, setFilterLocations] = useState<string[]>([])
  const [menuItems, setMenuItems] = useState(0)
  const [staff, setStaff] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''))
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [ordersRes, menuRes, staffRes, locationsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('available', true),
      supabase.from('staff').select('id', { count: 'exact', head: true }),
      supabase.from('locations').select('*').eq('is_active', true),
    ])
    setAllOrders(ordersRes.data || [])
    setMenuItems(menuRes.count || 0)
    setStaff(staffRes.count || 0)
    setLocations(locationsRes.data || [])
    setLoading(false)
  }

  const toggleLocation = (name: string) => {
    setFilterLocations(prev =>
      prev.includes(name) ? prev.filter(l => l !== name) : [...prev, name]
    )
  }

  const filteredOrders = filterLocations.length === 0
    ? allOrders
    : allOrders.filter(o => filterLocations.includes(o.location))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOrders = filteredOrders.filter(o => new Date(o.created_at) >= today)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
  const recentOrders = filteredOrders.slice(0, 8)

  const statCards = [
    { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, sub: `Total: $${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: '#F5C800' },
    { label: "Today's Orders", value: todayOrders.length, sub: `Total: ${filteredOrders.length}`, icon: ShoppingBag, color: '#4a9eff' },
    { label: 'Menu Items', value: menuItems, sub: 'Active items', icon: UtensilsCrossed, color: '#22c55e' },
    { label: 'Staff Members', value: staff, sub: 'All roles', icon: Users, color: '#a855f7' },
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
      <div className="flex items-center justify-between mb-6">
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

      {/* Location Filter */}
      {locations.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} style={{ color: '#888' }} />
            <span className="text-xs font-medium" style={{ color: '#888' }}>Filter by Location</span>
            {filterLocations.length > 0 && (
              <button onClick={() => setFilterLocations([])} className="text-xs underline ml-1" style={{ color: '#F5C800' }}>
                Clear (showing all)
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {locations.map(loc => (
              <button key={loc.id} onClick={() => toggleLocation(loc.name)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: filterLocations.includes(loc.name) ? '#F5C800' : '#f5f5f5',
                  color: filterLocations.includes(loc.name) ? '#1A1A1A' : '#666',
                  border: filterLocations.includes(loc.name) ? '1px solid #F5C800' : '1px solid #e5e5e5',
                }}>
                {filterLocations.includes(loc.name) ? '✓ ' : ''}{loc.name}
              </button>
            ))}
          </div>
          {filterLocations.length > 0 && (
            <p className="text-xs mt-2" style={{ color: '#aaa' }}>
              Showing data for: {filterLocations.join(', ')}
            </p>
          )}
        </div>
      )}

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
                  <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Location</th>
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
                      <td className="py-3 text-xs" style={{ color: '#888' }}>{order.location || '—'}</td>
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
                <div key={loc.id}
                  onClick={() => toggleLocation(loc.name)}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    backgroundColor: filterLocations.includes(loc.name) ? '#FFF8DC' : '#f9f9f9',
                    border: filterLocations.includes(loc.name) ? '1px solid #F5C800' : '1px solid transparent'
                  }}>
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

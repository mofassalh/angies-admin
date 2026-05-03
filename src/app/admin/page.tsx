'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ShoppingBag, Users, TrendingUp, RefreshCw } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations')
  const [menuItems, setMenuItems] = useState(0)
  const [staff, setStaff] = useState(0)
  const [dateFilter, setDateFilter] = useState('today')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''))
    fetchAll()
    // Read selected location from localStorage
    const loc = localStorage.getItem('selectedLocation') || 'All Locations'
    setSelectedLocation(loc)
    // Listen for location changes
    const handleStorage = () => {
      const newLoc = localStorage.getItem('selectedLocation') || 'All Locations'
      setSelectedLocation(newLoc)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [ordersRes, menuRes, staffRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('available', true),
      supabase.from('staff').select('id', { count: 'exact', head: true }),
    ])
    setAllOrders(ordersRes.data || [])
    setMenuItems(menuRes.count || 0)
    setStaff(staffRes.count || 0)
    setLoading(false)
  }

  const toggleLocation = (name: string) => {
    setFilterLocations(prev => prev.includes(name) ? prev.filter(l => l !== name) : [...prev, name])
  }

  const filteredByLocation = selectedLocation === 'All Locations'
    ? allOrders
    : allOrders.filter(o => o.location === selectedLocation)

  const now = new Date()
  const today = new Date(); today.setHours(0,0,0,0)
  const week = new Date(); week.setDate(week.getDate() - 7)
  const month = new Date(); month.setDate(1); month.setHours(0,0,0,0)

  const filteredOrders = filteredByLocation.filter(o => {
    const d = new Date(o.created_at)
    if (dateFilter === 'today') return d >= today
    if (dateFilter === '7days') return d >= week
    if (dateFilter === 'month') return d >= month
    return true
  })

  const todayOrders = filteredByLocation.filter(o => new Date(o.created_at) >= today)
  const todayRevenue = todayOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
  const totalRevenue = filteredByLocation.reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
  const avgOrder = filteredOrders.length > 0 ? filteredOrders.reduce((s,o) => s+(parseFloat(o.total)||0), 0) / filteredOrders.length : 0

  // Hourly revenue chart data
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const orders = filteredOrders.filter(o => new Date(o.created_at).getHours() === h)
    return {
      hour: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`,
      revenue: orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
      orders: orders.length,
    }
  }).filter(d => d.revenue > 0 || d.orders > 0)

  // Last 7 days bar chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const orders = filteredByLocation.filter(o => {
      const od = new Date(o.created_at); return od >= d && od < next
    })
    return {
      day: d.toLocaleDateString('en-AU', { weekday: 'short' }),
      revenue: orders.reduce((s,o) => s+(parseFloat(o.total)||0), 0),
      orders: orders.length,
    }
  })

  // Pickup vs Delivery pie
  const pickupCount = filteredOrders.filter(o => o.order_type === 'pickup').length
  const deliveryCount = filteredOrders.filter(o => o.order_type === 'delivery').length
  const pieData = [
    { name: 'Pickup', value: pickupCount, color: '#F5C800' },
    { name: 'Delivery', value: deliveryCount, color: '#4a9eff' },
  ].filter(d => d.value > 0)

  // Status breakdown
  const statusBreakdown = ['pending','confirmed','preparing','ready','completed','cancelled'].map(s => ({
    status: s,
    count: filteredOrders.filter(o => o.status === s).length,
  })).filter(d => d.count > 0)



  const fmt = (n: number) => `$${n.toFixed(2)}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Dashboard</h2>
          <p className="mt-1 text-sm" style={{ color: '#888' }}>Welcome back, {email}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl outline-none"
            style={{ border: '1px solid #e5e5e5', color: '#1A1A1A', background: 'white' }}>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#f5f5f5', color: '#555' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>



      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Today's Revenue", value: fmt(todayRevenue), sub: `Total: ${fmt(totalRevenue)}`, icon: TrendingUp, color: '#F5C800' },
          { label: "Today's Orders", value: todayOrders.length, sub: `Total: ${filteredByLocation.length}`, icon: ShoppingBag, color: '#4a9eff' },
          { label: 'Avg Order Value', value: fmt(avgOrder), sub: `${filteredOrders.length} orders`, icon: TrendingUp, color: '#22c55e' },
          { label: 'Staff Members', value: staff, sub: 'All roles', icon: Users, color: '#a855f7' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: '#888' }}>{label}</span>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{loading ? '—' : value}</div>
            <div className="text-xs mt-1" style={{ color: '#bbb' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Revenue by day */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="mb-4">
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Revenue — Last 7 Days</div>
            <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>Daily revenue breakdown</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7Days} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#ccc' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#ccc' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v: any) => [`$${parseFloat(v).toFixed(2)}`, 'Revenue']}
                contentStyle={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#F5C800" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pickup vs Delivery */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="mb-4">
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Order Type</div>
            <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>Pickup vs Delivery</div>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, 'Orders']}
                    contentStyle={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs" style={{ color: '#666' }}>{d.name}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
                        {((d.value / (pickupCount + deliveryCount)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#f5f5f5' }}>
                      <div className="h-1.5 rounded-full" style={{ background: d.color, width: `${((d.value / (pickupCount + deliveryCount)) * 100).toFixed(0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#ccc' }}>No data</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Hourly revenue */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="mb-4">
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Revenue by Hour</div>
            <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>Peak hours analysis</div>
          </div>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5C800" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F5C800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#ccc' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#ccc' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: any) => [`$${parseFloat(v).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#F5C800" fill="url(#hourGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#ccc' }}>No data for selected period</div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="mb-4">
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Order Status</div>
            <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>Current breakdown</div>
          </div>
          {statusBreakdown.length > 0 ? (
            <div className="space-y-2">
              {statusBreakdown.map(({ status, count }) => {
                const sc = STATUS_COLORS[status]
                const pct = ((count / filteredOrders.length) * 100).toFixed(0)
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs capitalize font-medium" style={{ color: sc.text }}>{status}</span>
                      <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#f5f5f5' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ background: sc.text, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#ccc' }}>No data</div>
          )}
        </div>
      </div>


    </div>
  )
}

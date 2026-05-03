'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download } from 'lucide-react'

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('7days')
  const [tab, setTab] = useState('sales')
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: true })
      setOrders(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const now = new Date()
  const filtered = orders.filter(o => {
    const d = new Date(o.created_at)
    if (dateFilter === 'today') { const t = new Date(); t.setHours(0,0,0,0); return d >= t }
    if (dateFilter === '7days') { const t = new Date(); t.setDate(t.getDate()-7); return d >= t }
    if (dateFilter === 'month') { const t = new Date(); t.setDate(1); t.setHours(0,0,0,0); return d >= t }
    if (dateFilter === '3months') { const t = new Date(); t.setMonth(t.getMonth()-3); return d >= t }
    return true
  })

  const totalRevenue = filtered.reduce((s,o) => s+(parseFloat(o.total)||0), 0)
  const avgOrder = filtered.length > 0 ? totalRevenue / filtered.length : 0
  const pickupOrders = filtered.filter(o => o.order_type === 'pickup')
  const deliveryOrders = filtered.filter(o => o.order_type === 'delivery')
  const pickupRevenue = pickupOrders.reduce((s,o) => s+(parseFloat(o.total)||0), 0)
  const deliveryRevenue = deliveryOrders.reduce((s,o) => s+(parseFloat(o.total)||0), 0)
  const completedOrders = filtered.filter(o => o.status === 'completed')

  // Daily revenue
  const dailyData = Array.from({ length: dateFilter === 'today' ? 24 : dateFilter === '7days' ? 7 : dateFilter === 'month' ? 30 : 90 }, (_, i) => {
    let d: Date, label: string
    if (dateFilter === 'today') {
      d = new Date(); d.setHours(i, 0, 0, 0)
      label = i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i-12}pm`
      const next = new Date(d); next.setHours(i+1)
      const dayOrders = filtered.filter(o => { const od = new Date(o.created_at); return od >= d && od < next })
      return { label, revenue: dayOrders.reduce((s,o) => s+(parseFloat(o.total)||0), 0), orders: dayOrders.length }
    } else {
      const days = dateFilter === '7days' ? 7 : dateFilter === 'month' ? 30 : 90
      d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); d.setHours(0,0,0,0)
      const next = new Date(d); next.setDate(next.getDate()+1)
      label = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
      const dayOrders = filtered.filter(o => { const od = new Date(o.created_at); return od >= d && od < next })
      return { label, revenue: dayOrders.reduce((s,o) => s+(parseFloat(o.total)||0), 0), orders: dayOrders.length }
    }
  }).filter(d => dateFilter === 'today' ? true : true)

  // Location breakdown
  const locationData = [...new Set(filtered.map(o => o.location).filter(Boolean))].map(loc => ({
    name: loc,
    revenue: filtered.filter(o => o.location === loc).reduce((s,o) => s+(parseFloat(o.total)||0), 0),
    orders: filtered.filter(o => o.location === loc).length,
  })).sort((a,b) => b.revenue - a.revenue)

  // Top items
  const itemMap: Record<string, { name: string, count: number, revenue: number }> = {}
  filtered.forEach(o => {
    (o.items || []).forEach((item: any) => {
      if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, count: 0, revenue: 0 }
      itemMap[item.name].count += item.quantity || 1
      itemMap[item.name].revenue += parseFloat(item.lineTotal || item.price) || 0
    })
  })
  const topItems = Object.values(itemMap).sort((a,b) => b.count - a.count).slice(0, 8)

  const fmt = (n: number) => `$${n.toFixed(2)}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`

  const pieData = [
    { name: 'Pickup', value: pickupOrders.length, color: '#F5C800' },
    { name: 'Delivery', value: deliveryOrders.length, color: '#4a9eff' },
  ].filter(d => d.value > 0)

  const tabs = ['sales', 'orders', 'items', 'locations']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Reports</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Sales analytics & insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl outline-none"
            style={{ border: '1px solid #e5e5e5', color: '#1A1A1A', background: 'white' }}>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="all">All Time</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid #e5e5e5', color: '#555', background: 'white' }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue) },
          { label: 'Total Orders', value: filtered.length.toString() },
          { label: 'Avg Order Value', value: fmt(avgOrder) },
          { label: 'Completed Orders', value: completedOrders.length.toString() },
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#888' }}>{k.label}</div>
            <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{loading ? '—' : k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={{
              background: tab === t ? '#1A1A1A' : 'white',
              color: tab === t ? 'white' : '#666',
              border: '1px solid #e5e5e5',
            }}>{t}</button>
        ))}
      </div>

      {/* Sales tab */}
      {tab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="font-semibold text-sm mb-1" style={{ color: '#1A1A1A' }}>Revenue Over Time</div>
            <div className="text-xs mb-4" style={{ color: '#aaa' }}>Total: {fmt(totalRevenue)}</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5C800" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F5C800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#ccc' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#ccc' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: any) => [fmt(parseFloat(v)), 'Revenue']}
                  contentStyle={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#F5C800" fill="url(#grad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="font-semibold text-sm mb-1" style={{ color: '#1A1A1A' }}>Order Type Split</div>
            <div className="text-xs mb-4" style={{ color: '#aaa' }}>Pickup vs Delivery</div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-2">
                  {[
                    { label: 'Pickup', count: pickupOrders.length, revenue: pickupRevenue, color: '#F5C800' },
                    { label: 'Delivery', count: deliveryOrders.length, revenue: deliveryRevenue, color: '#4a9eff' },
                  ].map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs" style={{ color: '#666' }}>{d.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{fmt(d.revenue)}</div>
                        <div className="text-xs" style={{ color: '#aaa' }}>{d.count} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#ccc' }}>No data</div>}
          </div>
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
          <div className="font-semibold text-sm mb-1" style={{ color: '#1A1A1A' }}>Orders Over Time</div>
          <div className="text-xs mb-4" style={{ color: '#aaa' }}>Total: {filtered.length} orders</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData} barSize={dateFilter === '7days' ? 28 : 16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#ccc' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#ccc' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip formatter={(v: any) => [v, 'Orders']}
                contentStyle={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="orders" fill="#4a9eff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Items tab */}
      {tab === 'items' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
          <div className="p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Top Menu Items</div>
            <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>By order count</div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                {['Item', 'Orders', 'Revenue', 'Popularity'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topItems.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: '#ccc' }}>No data</td></tr>
              ) : topItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: i < topItems.length-1 ? '1px solid #f9f9f9' : 'none' }}>
                  <td className="px-5 py-3 font-medium text-sm" style={{ color: '#1A1A1A' }}>{item.name}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: '#555' }}>{item.count}</td>
                  <td className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A1A' }}>{fmt(item.revenue)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#f5f5f5' }}>
                        <div className="h-1.5 rounded-full" style={{ background: '#F5C800', width: `${(item.count / (topItems[0]?.count || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs" style={{ color: '#aaa' }}>{((item.count / (topItems[0]?.count || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Locations tab */}
      {tab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e5e5' }}>
            <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Revenue by Location</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={locationData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 10, fill: '#ccc' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} width={120} />
                <Tooltip formatter={(v: any) => [fmt(parseFloat(v)), 'Revenue']}
                  contentStyle={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#F5C800" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
            <div className="p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Location Breakdown</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Location', 'Orders', 'Revenue'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locationData.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm" style={{ color: '#ccc' }}>No data</td></tr>
                ) : locationData.map((loc, i) => (
                  <tr key={i} style={{ borderBottom: i < locationData.length-1 ? '1px solid #f9f9f9' : 'none' }}>
                    <td className="px-5 py-3 font-medium text-sm" style={{ color: '#1A1A1A' }}>{loc.name}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#555' }}>{loc.orders}</td>
                    <td className="px-5 py-3 font-semibold text-sm" style={{ color: '#1A1A1A' }}>{fmt(loc.revenue)}</td>
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

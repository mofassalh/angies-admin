'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Save } from 'lucide-react'

export default function PricingPage() {
  const [items, setItems] = useState<any[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filterCat, setFilterCat] = useState('All')
  const [bulkAmount, setBulkAmount] = useState('')
  const [bulkType, setBulkType] = useState('increase')
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('category').order('name')
    setItems(data || [])
    const map: Record<string, string> = {}
    data?.forEach((i: any) => { map[i.id] = String(i.price) })
    setPrices(map)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleSave = async () => {
    setSaving(true)
    for (const item of items) {
      const newPrice = parseFloat(prices[item.id])
      if (!isNaN(newPrice) && newPrice !== item.price) {
        await supabase.from('menu_items').update({ price: newPrice }).eq('id', item.id)
      }
    }
    await fetch()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const applyBulk = () => {
    if (!bulkAmount) return
    const amt = parseFloat(bulkAmount)
    const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat)
    const newPrices = { ...prices }
    filtered.forEach(item => {
      const current = parseFloat(prices[item.id]) || item.price
      if (bulkType === 'increase') newPrices[item.id] = String((current + amt).toFixed(2))
      else if (bulkType === 'decrease') newPrices[item.id] = String(Math.max(0, current - amt).toFixed(2))
      else if (bulkType === 'percent') newPrices[item.id] = String((current * (1 + amt/100)).toFixed(2))
    })
    setPrices(newPrices)
  }

  const cats = ['All', ...new Set(items.map(i => i.category).filter(Boolean))]
  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Price Settings</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Bulk update menu item prices</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: saved ? '#22c55e' : '#F5C800', color: saved ? 'white' : '#1A1A1A' }}>
          <Save size={15} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Prices'}
        </button>
      </div>

      {/* Bulk update */}
      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #e5e5e5' }}>
        <div className="font-semibold text-sm mb-4" style={{ color: '#1A1A1A' }}>Bulk Price Update</div>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Category</label>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Action</label>
            <select value={bulkType} onChange={e => setBulkType(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
              <option value="increase">Increase by $</option>
              <option value="decrease">Decrease by $</option>
              <option value="percent">Increase by %</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#888' }}>Amount</label>
            <input type="number" value={bulkAmount} onChange={e => setBulkAmount(e.target.value)}
              placeholder="e.g. 2.00"
              className="px-3 py-2.5 rounded-xl text-sm outline-none w-28"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <button onClick={applyBulk}
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#1A1A1A', color: 'white' }}>
            Apply
          </button>
        </div>
      </div>

      {/* Price table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              {['Item', 'Category', 'Current Price', 'New Price'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const changed = parseFloat(prices[item.id]) !== item.price
              return (
                <tr key={item.id} style={{ borderBottom: i < filtered.length-1 ? '1px solid #f9f9f9' : 'none', background: changed ? '#FFFEF0' : 'white' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? <img src={item.image_url} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: '#f5f5f5' }}>🍽️</div>}
                      <span className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#888' }}>{item.category || '—'}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: '#aaa', textDecoration: changed ? 'line-through' : 'none' }}>${item.price}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: '#aaa' }}>$</span>
                      <input type="number" step="0.5" value={prices[item.id] || ''}
                        onChange={e => setPrices(p => ({ ...p, [item.id]: e.target.value }))}
                        className="w-24 px-3 py-1.5 rounded-lg text-sm outline-none"
                        style={{ border: `1px solid ${changed ? '#F5C800' : '#e5e5e5'}`, color: '#1A1A1A', background: changed ? '#FFFEF0' : 'white' }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

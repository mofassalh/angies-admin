'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { ChevronUp, ChevronDown, Save } from 'lucide-react'

export default function CategoryOrderPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: items }, { data: orderData }] = await Promise.all([
        supabase.from('menu_items').select('category').eq('restaurant_id', RESTAURANT_ID),
        supabase.from('settings').select('value').eq('key', 'category_order').eq('restaurant_id', RESTAURANT_ID).single()
      ])
      const allCats = [...new Set((items || []).map((i: any) => i.category).filter(Boolean))] as string[]
      if (orderData?.value) {
        try {
          const saved = JSON.parse(orderData.value) as string[]
          const merged = [...saved.filter(c => allCats.includes(c)), ...allCats.filter(c => !saved.includes(c))]
          setCategories(merged)
        } catch { setCategories(allCats) }
      } else {
        setCategories(allCats)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const moveUp = (i: number) => {
    if (i === 0) return
    const c = [...categories]
    ;[c[i - 1], c[i]] = [c[i], c[i - 1]]
    setCategories(c)
  }

  const moveDown = (i: number) => {
    if (i === categories.length - 1) return
    const c = [...categories]
    ;[c[i], c[i + 1]] = [c[i + 1], c[i]]
    setCategories(c)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('settings').upsert(
      { key: 'category_order', value: JSON.stringify(categories), restaurant_id: RESTAURANT_ID },
      { onConflict: 'key,restaurant_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Category Order</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Drag to reorder or use arrows to set category display order</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ background: saved ? '#22c55e' : '#F5C800', color: saved ? 'white' : '#1A1A1A' }}>
          <Save size={16} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Order'}
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={cat} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3"
            style={{ border: '1px solid #e5e5e5' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: '#F5C800', color: '#1A1A1A' }}>{i + 1}</div>
            <div className="flex-1 font-medium text-gray-900">{cat}</div>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveUp(i)} disabled={i === 0}
                className="p-1 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-30">
                <ChevronUp size={16} className="text-gray-500" />
              </button>
              <button onClick={() => moveDown(i)} disabled={i === categories.length - 1}
                className="p-1 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-30">
                <ChevronDown size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

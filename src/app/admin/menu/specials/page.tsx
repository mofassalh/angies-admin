'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Tag } from 'lucide-react'

export default function SpecialsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('name')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const toggleSpecial = async (id: string, val: boolean) => {
    await supabase.from('menu_items').update({ is_special: !val }).eq('id', id)
    await fetch()
  }

  const specials = items.filter(i => i.is_special)
  const rest = items.filter(i => !i.is_special)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Specials</h2>
        <p className="text-sm mt-1" style={{ color: '#888' }}>Daily specials shown with special badge — {specials.length} active</p>
      </div>

      {specials.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#888' }}>🎯 Active Specials ({specials.length})</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {specials.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-3"
                style={{ border: '1.5px solid #22c55e' }}>
                {item.image_url ? (
                  <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: '#f5f5f5' }}>🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: '#1A1A1A' }}>{item.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>${item.price} · {item.category}</div>
                </div>
                <button onClick={() => toggleSpecial(item.id, item.is_special)}
                  className="p-2 rounded-xl"
                  style={{ background: '#f0fdf4' }}>
                  <Tag size={16} stroke="#22c55e" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#888' }}>All Items</div>
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} /></div>
          ) : rest.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: '#aaa' }}>All items are specials!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Item', 'Category', 'Price', 'Mark as Special'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rest.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < rest.length-1 ? '1px solid #f9f9f9' : 'none' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: '#f5f5f5' }}>🍽️</div>
                        )}
                        <span className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#888' }}>{item.category || '—'}</td>
                    <td className="px-5 py-3 font-medium text-sm" style={{ color: '#1A1A1A' }}>${item.price}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleSpecial(item.id, item.is_special)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ border: '1px solid #e5e5e5', color: '#888' }}>
                        <Tag size={12} /> Mark Special
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

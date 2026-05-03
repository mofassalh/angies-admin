'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const COURSES = ['Starter', 'Main', 'Dessert', 'Drinks', 'Sides']

export default function CoursesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState('Main')
  const supabase = createClient()

  const fetch = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('name')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const setCourse = async (id: string, course: string) => {
    await supabase.from('menu_items').update({ course }).eq('id', id)
    await fetch()
  }

  const courseItems = items.filter(i => i.course === activeCourse)
  const unassigned = items.filter(i => !i.course)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Courses</h2>
        <p className="text-sm mt-1" style={{ color: '#888' }}>Group menu items by course type</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {COURSES.map(c => (
          <button key={c} onClick={() => setActiveCourse(c)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeCourse === c ? '#1A1A1A' : 'white',
              color: activeCourse === c ? 'white' : '#666',
              border: '1px solid #e5e5e5',
            }}>
            {c} ({items.filter(i => i.course === c).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{activeCourse} ({courseItems.length})</div>
          </div>
          {courseItems.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: '#aaa' }}>No items in {activeCourse}</div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#f9f9f9' }}>
              {courseItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-4">
                  {item.image_url ? <img src={item.image_url} className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#f5f5f5' }}>🍽️</div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: '#1A1A1A' }}>{item.name}</div>
                    <div className="text-xs" style={{ color: '#aaa' }}>${item.price}</div>
                  </div>
                  <button onClick={() => setCourse(item.id, '')}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ border: '1px solid #fca5a5', color: '#dc2626', background: '#fff5f5' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>Unassigned ({unassigned.length})</div>
          </div>
          {unassigned.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: '#aaa' }}>All items assigned!</div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#f9f9f9' }}>
              {unassigned.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-4">
                  {item.image_url ? <img src={item.image_url} className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#f5f5f5' }}>🍽️</div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: '#1A1A1A' }}>{item.name}</div>
                    <div className="text-xs" style={{ color: '#aaa' }}>${item.price}</div>
                  </div>
                  <button onClick={() => setCourse(item.id, activeCourse)}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: '#FFF9E0', color: '#8A6800', border: '1px solid #E8C84A' }}>
                    Add to {activeCourse}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

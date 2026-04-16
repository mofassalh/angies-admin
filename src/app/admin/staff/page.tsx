'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2, X, Check, Shield } from 'lucide-react'

type Staff = {
  id: string
  auth_id: string
  name: string
  email: string
  role: string
  permissions: any
  active: boolean
  created_at: string
}

const PERMISSIONS = [
  { key: 'orders', label: 'Orders' },
  { key: 'menu', label: 'Menu' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'staff', label: 'Staff' },
  { key: 'settings', label: 'Settings' },
  { key: 'locations', label: 'Locations' },
]

const empty = { id: '', auth_id: '', name: '', email: '', password: '', role: 'staff', permissions: {}, active: true }

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false })
    setStaffList(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  const openAdd = () => { setForm(empty); setEditing(false); setError(''); setShowModal(true) }
  const openEdit = (s: Staff) => { setForm({ ...s, password: '' }); setEditing(true); setError(''); setShowModal(true) }

  const togglePermission = (key: string) => {
    setForm((f: any) => ({
      ...f,
      permissions: { ...f.permissions, [key]: !f.permissions?.[key] }
    }))
  }

  const handleSave = async () => {
    if (!form.name || !form.email) return
    if (!editing && !form.password) { setError('Password is required'); return }
    setSaving(true)
    setError('')

    const endpoint = '/api/staff'
    const method = editing ? 'PATCH' : 'POST'
    const body = editing
      ? { id: form.id, auth_id: form.auth_id, name: form.name, email: form.email, password: form.password, role: form.role, permissions: form.permissions, active: form.active }
      : { name: form.name, email: form.email, password: form.password, role: form.role, permissions: form.permissions, active: form.active }

    const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()

    if (data.error) {
      setError(data.error)
    } else {
      setShowModal(false)
      fetchStaff()
    }
    setSaving(false)
  }

  const handleDelete = async (s: Staff) => {
    if (!confirm(`Delete ${s.name}?`)) return
    await fetch('/api/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, auth_id: s.auth_id })
    })
    fetchStaff()
  }

  const toggleActive = async (s: Staff) => {
    await supabase.from('staff').update({ active: !s.active }).eq('id', s.id)
    fetchStaff()
  }

  const ROLE_STYLE: any = {
    owner: { bg: '#fff8e1', text: '#b8860b' },
    staff: { bg: '#f0f4ff', text: '#3b4fd4' },
    kitchen: { bg: '#f0fdf4', text: '#15803d' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Staff</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>{staffList.length} members</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        {loading ? (
          <p className="p-6 text-sm" style={{ color: '#aaa' }}>Loading...</p>
        ) : staffList.length === 0 ? (
          <p className="p-6 text-sm" style={{ color: '#aaa' }}>No staff found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Name</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Email</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Role</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Permissions</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Active</th>
                <th className="text-left px-6 py-3 font-semibold" style={{ color: '#888' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s, i) => {
                const rs = ROLE_STYLE[s.role] || ROLE_STYLE.staff
                return (
                  <tr key={s.id} style={{ borderBottom: i < staffList.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <td className="px-6 py-4 font-medium" style={{ color: '#1A1A1A' }}>
                      <div className="flex items-center gap-2">
                        {s.role === 'owner' && <Shield size={14} style={{ color: '#F5C800' }} />}
                        {s.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: '#555' }}>{s.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                        style={{ backgroundColor: rs.bg, color: rs.text }}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.role === 'owner' ? (
                        <span className="text-xs" style={{ color: '#aaa' }}>Full Access</span>
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {PERMISSIONS.filter(p => s.permissions?.[p.key]).map(p => (
                            <span key={p.key} className="px-2 py-0.5 rounded-full text-xs"
                              style={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                              {p.label}
                            </span>
                          ))}
                          {!PERMISSIONS.some(p => s.permissions?.[p.key]) && (
                            <span className="text-xs" style={{ color: '#ccc' }}>No permissions</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(s)}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: s.active ? '#F5C800' : '#e5e5e5' }}>
                        {s.active && <Check size={14} style={{ color: '#1A1A1A' }} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg"
                          style={{ backgroundColor: '#f5f5f5', color: '#555' }}>
                          <Pencil size={14} />
                        </button>
                        {s.role !== 'owner' && (
                          <button onClick={() => handleDelete(s)} className="p-2 rounded-lg"
                            style={{ backgroundColor: '#fff0f0', color: '#ff4444' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                {editing ? 'Edit Staff' : 'Add Staff'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#aaa' }}><X size={20} /></button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#fff0f0', color: '#cc0000' }}>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <input placeholder="Full Name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <input placeholder="Email *" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <input placeholder={editing ? 'New Password (leave blank to keep)' : 'Password *'} type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <select value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }}>
                <option value="staff">Staff</option>
                <option value="kitchen">Kitchen</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            {form.role === 'staff' && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-3" style={{ color: '#1A1A1A' }}>Permissions</p>
                <div className="space-y-2">
                  {PERMISSIONS.map(p => (
                    <div key={p.key} className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                      style={{ backgroundColor: '#f9f9f9' }}>
                      <span className="text-sm" style={{ color: '#333' }}>{p.label}</span>
                      <button onClick={() => togglePermission(p.key)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition"
                        style={{ backgroundColor: form.permissions?.[p.key] ? '#F5C800' : '#e5e5e5' }}>
                        {form.permissions?.[p.key] && <Check size={14} style={{ color: '#1A1A1A' }} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.role === 'kitchen' && (
              <div className="mt-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#f0fdf4' }}>
                <p className="text-sm" style={{ color: '#15803d' }}>Kitchen staff can only view and update orders.</p>
              </div>
            )}

            {form.role === 'owner' && (
              <div className="mt-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#fff8e1' }}>
                <p className="text-sm" style={{ color: '#b8860b' }}>Owner has full access to all features.</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #e5e5e5', color: '#555' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

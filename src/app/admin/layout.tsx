'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  Users, Settings, LogOut, Menu
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed, permission: 'menu' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, permission: 'orders' },
  { href: '/admin/staff', label: 'Staff', icon: Users, permission: 'staff' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [staff, setStaff] = useState<any>({ role: 'owner', permissions: {} })
  const [loadingAuth, setLoadingAuth] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email || '')

      try {
        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle()

        if (staffData) {
          setStaff(staffData)
        } else {
          const { data: ownerData } = await supabase
            .from('staff')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()

          if (ownerData) {
            await supabase.from('staff').update({ auth_id: user.id }).eq('id', ownerData.id)
            setStaff({ ...ownerData, auth_id: user.id })
          } else {
            // Not in staff table — treat as owner
            setStaff({ role: 'owner', permissions: {}, name: user.email })
          }
        }
      } catch {
        setStaff({ role: 'owner', permissions: {}, name: user.email })
      }

      setLoadingAuth(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const canAccess = (permission: string) => {
    if (!staff) return false
    if (staff.role === 'owner') return true
    return staff.permissions?.[permission] === true
  }

  const visibleNav = navItems.filter(item => canAccess(item.permission))

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
            style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#888' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f5f5' }}>
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col`}
        style={{ backgroundColor: '#1A1A1A' }}>
        <div className="p-6" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <h1 className="text-2xl font-bold" style={{ color: '#F5C800' }}>Angie's</h1>
          <p className="text-xs mt-1" style={{ color: '#666' }}>
            {staff?.role === 'owner' ? 'Owner' : staff?.role === 'kitchen' ? 'Kitchen' : 'Staff'} Panel
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium"
              style={{
                backgroundColor: pathname === href ? '#F5C800' : 'transparent',
                color: pathname === href ? '#1A1A1A' : '#aaa',
              }}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid #2a2a2a' }}>
          <p className="text-xs mb-1 truncate" style={{ color: '#555' }}>{userEmail}</p>
          <p className="text-xs mb-3 capitalize" style={{ color: '#444' }}>{staff?.name || ''}</p>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm w-full transition"
            style={{ color: '#aaa' }}
            onMouseOver={e => (e.currentTarget.style.color = '#F5C800')}
            onMouseOut={e => (e.currentTarget.style.color = '#aaa')}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 py-3 flex items-center lg:hidden"
          style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #2a2a2a' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: '#aaa' }}>
            <Menu size={22} />
          </button>
          <h1 className="font-bold ml-3" style={{ color: '#F5C800' }}>Angie's Admin</h1>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

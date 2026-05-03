'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, MapPin,
  Users, Settings, LogOut, Menu, Monitor, ChevronDown, Bell,
  BarChart2, Megaphone, Gift, Truck, Clock, Store, KeyRound
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/admin/orders', label: 'Realtime Orders', icon: Monitor, permission: 'orders' },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed, permission: 'menu' },
  { href: '/admin/locations', label: 'Locations', icon: MapPin, permission: 'locations' },
  { href: '/admin/staff', label: 'Staff', icon: Users, permission: 'staff' },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2, permission: 'dashboard' },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone, permission: 'dashboard' },
  { href: '/admin/loyalty', label: 'Loyalty', icon: Gift, permission: 'dashboard' },
  { href: '/admin/delivery', label: 'Delivery', icon: Truck, permission: 'dashboard' },
  { href: '/admin/pickup', label: 'Pickup', icon: Clock, permission: 'dashboard' },
  { href: '/admin/restaurant', label: 'Restaurant', icon: Store, permission: 'dashboard' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [staff, setStaff] = useState<any>({ role: 'owner', permissions: {} })
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations')
  const [locationDropdown, setLocationDropdown] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email || '')

      try {
        const { data: staffData } = await supabase.from('staff').select('*').eq('auth_id', user.id).maybeSingle()
        if (staffData) {
          setStaff(staffData)
        } else {
          const { data: ownerData } = await supabase.from('staff').select('*').eq('email', user.email).maybeSingle()
          if (ownerData) {
            await supabase.from('staff').update({ auth_id: user.id }).eq('id', ownerData.id)
            setStaff({ ...ownerData, auth_id: user.id })
          } else {
            setStaff({ role: 'owner', permissions: {}, name: user.email })
          }
        }
      } catch {
        setStaff({ role: 'owner', permissions: {}, name: user.email })
      }

      const { data: locsData } = await supabase.from('locations').select('*').eq('is_active', true).order('name')
      if (locsData) setLocations(locsData)

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
        <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const initials = (staff?.name || userEmail || '?').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f5f5' }}>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}
        style={{ backgroundColor: '#1A1A1A' }}>

        {/* Logo */}
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>A</div>
          <div>
            <div className="font-bold text-white text-sm">Angie's</div>
            <div className="text-xs" style={{ color: '#666' }}>
              {staff?.role === 'owner' ? 'Owner Panel' : staff?.role === 'kitchen' ? 'Kitchen' : 'Staff Panel'}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-0.5">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium"
                style={{
                  backgroundColor: isActive ? '#F5C800' : 'transparent',
                  color: isActive ? '#1A1A1A' : '#888',
                }}>
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4" style={{ borderTop: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>{initials}</div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">{staff?.name || 'Admin'}</div>
              <div className="text-xs truncate" style={{ color: '#555' }}>{userEmail}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-xl transition-all"
            style={{ color: '#888' }}
            onMouseOver={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#fff' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="px-6 py-3 flex items-center justify-between bg-white"
          style={{ borderBottom: '1px solid #e5e5e5', height: 60 }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: '#888' }}>
            <Menu size={22} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* Location switcher */}
            <div className="relative">
              <button
                onClick={() => setLocationDropdown(!locationDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A', background: 'white' }}>
                <MapPin size={14} style={{ color: '#F5C800' }} />
                {selectedLocation}
                <ChevronDown size={14} style={{ color: '#aaa' }} />
              </button>
              {locationDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-50 min-w-48 py-1"
                  style={{ border: '1px solid #e5e5e5' }}>
                  <button
                    onClick={() => { setSelectedLocation('All Locations'); setLocationDropdown(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: selectedLocation === 'All Locations' ? '#F5C800' : '#1A1A1A', fontWeight: selectedLocation === 'All Locations' ? 600 : 400 }}>
                    All Locations
                  </button>
                  {locations.map(loc => (
                    <button key={loc.id}
                      onClick={() => { setSelectedLocation(loc.name); setLocationDropdown(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: selectedLocation === loc.name ? '#F5C800' : '#1A1A1A', fontWeight: selectedLocation === loc.name ? 600 : 400 }}>
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bell */}
            <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ border: '1px solid #e5e5e5', color: '#888' }}>
              <Bell size={16} />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>{initials}</div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

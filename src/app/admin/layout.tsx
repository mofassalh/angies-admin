'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Monitor, UtensilsCrossed, BarChart2, Megaphone,
  Gift, Truck, Clock, Store, Settings, LogOut, Menu, ChevronDown,
  ChevronRight, Bell, MapPin, Users, Key
} from 'lucide-react'

type NavChild = { label: string, href: string, badge?: string }
type NavItem = {
  href?: string, label: string, icon: any, permission: string,
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/admin/orders', label: 'Realtime Orders', icon: Monitor, permission: 'orders' },
  {
    label: 'Menu', icon: UtensilsCrossed, permission: 'menu',
    children: [
      { label: 'Menu Items', href: '/admin/menu' },
      { label: 'Modifiers', href: '/admin/menu/modifiers' },
      { label: 'Ingredients', href: '/admin/menu/ingredients' },
      { label: 'Menu Editor', href: '/admin/menu/editor', badge: 'Beta' },
      { label: 'Price Settings', href: '/admin/menu/pricing' },
      { label: 'Courses', href: '/admin/menu/courses' },
      { label: 'Populars', href: '/admin/menu/populars' },
      { label: 'Specials', href: '/admin/menu/specials' },
    ]
  },
  {
    label: 'Reports', icon: BarChart2, permission: 'dashboard',
    children: [
      { label: 'Sales', href: '/admin/reports' },
      { label: 'Delivery', href: '/admin/reports/delivery' },
      { label: 'Pickup', href: '/admin/reports/pickup' },
    ]
  },
  {
    label: 'Marketing', icon: Megaphone, permission: 'dashboard',
    children: [
      { label: 'Coupons', href: '/admin/marketing' },
      { label: 'Campaigns', href: '/admin/marketing/campaigns' },
    ]
  },
  {
    label: 'Loyalty', icon: Gift, permission: 'dashboard',
    children: [
      { label: 'Points', href: '/admin/loyalty' },
      { label: 'Rewards', href: '/admin/loyalty/rewards' },
      { label: 'Customers', href: '/admin/loyalty/customers' },
    ]
  },
  {
    label: 'Loyalty V2', icon: Gift, permission: 'dashboard',
    children: [
      { label: 'Overview', href: '/admin/loyalty-v2', badge: 'Beta' },
    ]
  },
  {
    label: 'Delivery', icon: Truck, permission: 'dashboard',
    children: [
      { label: 'Statistics', href: '/admin/delivery' },
      { label: 'Settings', href: '/admin/delivery/settings' },
      { label: 'Zones', href: '/admin/delivery/zones' },
    ]
  },
  {
    label: 'Pickup', icon: Clock, permission: 'dashboard',
    children: [
      { label: 'Statistics', href: '/admin/pickup' },
      { label: 'Settings', href: '/admin/pickup/settings' },
    ]
  },
  {
    label: 'Restaurant', icon: Store, permission: 'dashboard',
    children: [
      { label: 'Settings', href: '/admin/restaurant' },
    ]
  },
  {
    label: 'Settings', icon: Settings, permission: 'settings',
    children: [
      { label: 'General', href: '/admin/settings' },
      { label: 'Locations', href: '/admin/locations' },
      { label: 'Staff', href: '/admin/staff' },
      { label: 'Authentication Code', href: '/admin/settings/auth-code' },
    ]
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [staff, setStaff] = useState<any>({ role: 'owner', permissions: {} })
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations')
  const [locationDropdown, setLocationDropdown] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>([])
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
        if (staffData) setStaff(staffData)
        else {
          const { data: ownerData } = await supabase.from('staff').select('*').eq('email', user.email).maybeSingle()
          if (ownerData) { await supabase.from('staff').update({ auth_id: user.id }).eq('id', ownerData.id); setStaff({ ...ownerData, auth_id: user.id }) }
          else setStaff({ role: 'owner', permissions: {}, name: user.email })
        }
      } catch { setStaff({ role: 'owner', permissions: {}, name: user.email }) }
      const { data: locsData } = await supabase.from('locations').select('*').eq('is_active', true).order('name')
      if (locsData) setLocations(locsData)
      setLoadingAuth(false)
    }
    init()
    // Auto-expand current section
    navItems.forEach(item => {
      if (item.children?.some(c => pathname.startsWith(c.href))) {
        setOpenSections(prev => prev.includes(item.label) ? prev : [...prev, item.label])
      }
    })
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const canAccess = (permission: string) => {
    if (!staff) return false
    if (staff.role === 'owner') return true
    return staff.permissions?.[permission] === true
  }

  const toggleSection = (label: string) => {
    setOpenSections(prev => prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label])
  }

  const isActive = (item: NavItem) => {
    if (item.href) return item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
    return item.children?.some(c => pathname.startsWith(c.href)) || false
  }

  if (loadingAuth) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
    </div>
  )

  const initials = (staff?.name || userEmail || '?').slice(0, 2).toUpperCase()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>A</div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Angie's</div>
          <div className="text-xs" style={{ color: '#aaa' }}>
            {staff?.role === 'owner' ? 'Owner Panel' : staff?.role === 'kitchen' ? 'Kitchen' : 'Staff Panel'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.filter(item => canAccess(item.permission)).map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          const expanded = openSections.includes(item.label)

          if (!item.children) {
            return (
              <Link key={item.href} href={item.href!}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all text-sm font-medium mb-0.5"
                style={{
                  backgroundColor: active ? '#FFF9E0' : 'transparent',
                  color: active ? '#1A1A1A' : '#666',
                }}>
                <Icon size={16} style={{ color: active ? '#D4A900' : '#aaa', flexShrink: 0 }} />
                <span>{item.label}</span>
                {active && <div className="absolute left-0 w-0.5 h-6 rounded-r" style={{ background: '#F5C800' }} />}
              </Link>
            )
          }

          return (
            <div key={item.label} className="mb-0.5">
              <button
                onClick={() => toggleSection(item.label)}
                className="flex items-center gap-3 w-full mx-2 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
                style={{
                  width: 'calc(100% - 16px)',
                  backgroundColor: active && !expanded ? '#FFF9E0' : 'transparent',
                  color: active ? '#1A1A1A' : '#666',
                }}>
                <Icon size={16} style={{ color: active ? '#D4A900' : '#aaa', flexShrink: 0 }} />
                <span className="flex-1 text-left">{item.label}</span>
                {expanded
                  ? <ChevronDown size={14} style={{ color: '#ccc', flexShrink: 0 }} />
                  : <ChevronRight size={14} style={{ color: '#ccc', flexShrink: 0 }} />
                }
              </button>
              {expanded && (
                <div className="ml-8 mr-2 mb-1">
                  {item.children.map(child => {
                    const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
                    return (
                      <Link key={child.href} href={child.href}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
                        style={{
                          backgroundColor: childActive ? '#FFF9E0' : 'transparent',
                          color: childActive ? '#D4A900' : '#888',
                          fontWeight: childActive ? 500 : 400,
                        }}>
                        <span>{child.label}</span>
                        {child.badge && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: '#f0f0f0', color: '#888', fontSize: 10 }}>{child.badge}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4" style={{ borderTop: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>{initials}</div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>{staff?.name || 'Admin'}</div>
            <div className="text-xs truncate" style={{ color: '#aaa' }}>{userEmail}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-xl transition-all"
          style={{ color: '#aaa' }}
          onMouseOver={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#1A1A1A' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa' }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f5f5f5' }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white"
        style={{ borderRight: '1px solid #f0f0f0', height: '100vh', position: 'sticky', top: 0 }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white transform transition-transform duration-200 lg:hidden flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRight: '1px solid #f0f0f0' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="px-6 py-3 flex items-center justify-between bg-white"
          style={{ borderBottom: '1px solid #f0f0f0', height: 60, position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: '#888' }}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {/* Location switcher */}
            <div className="relative">
              <button onClick={() => setLocationDropdown(!locationDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A', background: 'white' }}>
                <MapPin size={13} style={{ color: '#F5C800' }} />
                <span className="max-w-40 truncate">{selectedLocation}</span>
                <ChevronDown size={13} style={{ color: '#aaa' }} />
              </button>
              {locationDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-50 min-w-48 py-1"
                  style={{ border: '1px solid #e5e5e5' }}>
                  <button onClick={() => { setSelectedLocation('All Locations'); setLocationDropdown(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: selectedLocation === 'All Locations' ? '#D4A900' : '#1A1A1A', fontWeight: selectedLocation === 'All Locations' ? 600 : 400 }}>
                    All Locations
                  </button>
                  {locations.map(loc => (
                    <button key={loc.id} onClick={() => { setSelectedLocation(loc.name); setLocationDropdown(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: selectedLocation === loc.name ? '#D4A900' : '#1A1A1A', fontWeight: selectedLocation === loc.name ? 600 : 400 }}>
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ border: '1px solid #e5e5e5', color: '#888' }}>
              <Bell size={16} />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
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

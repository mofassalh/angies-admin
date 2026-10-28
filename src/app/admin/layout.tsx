'use client'
import config from '../../../restaurant.config'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Monitor, UtensilsCrossed, BarChart2, Megaphone,
  Gift, Truck, Clock, Store, Settings, LogOut, Menu, ChevronDown,
  ChevronRight, Bell, MapPin, Users, Key, ChefHat, Home
} from 'lucide-react'

type NavChild = { label: string, href: string, badge?: string, permission?: string }
type NavItem = {
  href?: string, label: string, icon: any, permission: string,
  children?: NavChild[]
}

// 6 simple sections. Every old page is still here — only the grouping changed.
const navItems: NavItem[] = [
  {
    label: 'Today', icon: Home, permission: 'dashboard',
    children: [
      { label: 'Overview', href: '/admin', permission: 'dashboard' },
      { label: 'Live orders', href: '/admin/orders', permission: 'orders' },
    ]
  },
  { href: '/admin/kitchen', label: 'Kitchen', icon: ChefHat, permission: 'orders' },
  {
    label: 'Menu', icon: UtensilsCrossed, permission: 'menu',
    children: [
      { label: 'Menu items', href: '/admin/menu' },
      { label: 'Prices', href: '/admin/menu/pricing' },
      { label: 'Popular items', href: '/admin/menu/populars' },
      { label: 'Specials', href: '/admin/menu/specials' },
      { label: 'Options and extras', href: '/admin/menu/customization-templates' },
      { label: 'Category order', href: '/admin/menu/category-order' },
    ]
  },
  {
    label: 'Reports', icon: BarChart2, permission: 'dashboard',
    children: [
      { label: 'Sales', href: '/admin/reports' },
      { label: 'Pickup report', href: '/admin/reports/pickup' },
      { label: 'Delivery report', href: '/admin/reports/delivery' },
      { label: 'Pickup stats', href: '/admin/pickup' },
      { label: 'Delivery stats', href: '/admin/delivery' },
    ]
  },
  {
    label: 'Customers', icon: Users, permission: 'dashboard',
    children: [
      { label: 'Coupons', href: '/admin/marketing' },
      { label: 'Campaigns', href: '/admin/marketing/campaigns' },
      { label: 'Loyalty points', href: '/admin/loyalty' },
      { label: 'Rewards', href: '/admin/loyalty/rewards' },
      { label: 'Customer list', href: '/admin/loyalty/customers' },
    ]
  },
  {
    label: 'Settings', icon: Settings, permission: 'settings',
    children: [
      { label: 'Store open and hours', href: '/admin/restaurant', permission: 'dashboard' },
      { label: 'Pickup settings', href: '/admin/pickup/settings', permission: 'dashboard' },
      { label: 'Delivery settings', href: '/admin/delivery/settings', permission: 'dashboard' },
      { label: 'Delivery zones', href: '/admin/delivery/zones', permission: 'dashboard' },
      { label: 'Brand and website', href: '/admin/settings' },
      { label: 'Locations', href: '/admin/locations' },
      { label: 'Staff', href: '/admin/staff' },
      { label: 'Kitchen printers', href: '/admin/printers' },
      { label: 'Integrations', href: '/admin/integrations' },
      { label: 'Authentication code', href: '/admin/settings/auth-code' },
    ]
  },
]

// A link is active on its own page, or on a sub-page no other menu link owns
const ALL_HREFS = navItems.flatMap(i => i.children ? i.children.map(c => c.href) : [i.href!])
function matchHref(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === '/admin') return false
  if (!pathname.startsWith(href + '/')) return false
  return !ALL_HREFS.some(h => h !== href && h.length > href.length && (pathname === h || pathname.startsWith(h + '/')))
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [staff, setStaff] = useState<any>(null)
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
      // Only active staff may use the admin panel. Anyone else is signed out.
      let staffData: any = null
      try {
        const { data } = await supabase.from('staff').select('*').eq('auth_id', user.id).maybeSingle()
        staffData = data
        if (!staffData) {
          // First login of a staff member added by email: link their account (server-side check)
          const { data: linked } = await supabase.rpc('link_staff_account')
          if (linked) {
            const { data: again } = await supabase.from('staff').select('*').eq('auth_id', user.id).maybeSingle()
            staffData = again
          }
        }
      } catch { staffData = null }
      if (!staffData || staffData.active === false) {
        await supabase.auth.signOut()
        router.push('/login?error=no_access')
        return
      }
      setStaff(staffData)
      const { data: locsData } = await supabase.from('locations').select('*').eq('is_active', true).order('name')
      if (locsData) setLocations(locsData)
      setLoadingAuth(false)
    }
    init()

    // Session timeout — 30 minutes idle logout
    let timeout: ReturnType<typeof setTimeout>
    const resetTimeout = () => {
      clearTimeout(timeout)
      timeout = setTimeout(async () => {
        await supabase.auth.signOut()
        router.push("/login")
      }, 30 * 60 * 1000)
    }
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    events.forEach(e => window.addEventListener(e, resetTimeout))
    resetTimeout()

    // Auto-expand current section
    navItems.forEach(item => {
      if (item.children?.some(c => matchHref(pathname, c.href))) {
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
    setOpenSections(prev => prev.includes(label) ? [] : [label])
  }

  const isActive = (item: NavItem) => {
    if (item.href) return matchHref(pathname, item.href)
    return item.children?.some(c => matchHref(pathname, c.href)) || false
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
          style={{ backgroundColor: config.primaryColor, color: '#1A1A1A' }}>{config.name[0]}</div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#1A1A1A' }}>{config.name}</div>
          <div className="text-xs" style={{ color: '#aaa' }}>
            {staff?.role === 'owner' ? 'Owner Panel' : staff?.role === 'kitchen' ? 'Kitchen' : 'Staff Panel'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(item => item.children
            ? { ...item, children: item.children.filter(c => canAccess(c.permission || item.permission)) }
            : item
          ).filter(item => item.children ? item.children.length > 0 : canAccess(item.permission)).map((item) => {
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
                  color: active ? '#1A1A1A' : '#333',
                }}>
                <Icon size={16} style={{ color: active ? '#D4A900' : '#666', flexShrink: 0 }} />
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
                  color: active ? '#1A1A1A' : '#333',
                }}>
                <Icon size={16} style={{ color: active ? '#D4A900' : '#666', flexShrink: 0 }} />
                <span className="flex-1 text-left">{item.label}</span>
                {expanded
                  ? <ChevronDown size={14} style={{ color: '#ccc', flexShrink: 0 }} />
                  : <ChevronRight size={14} style={{ color: '#ccc', flexShrink: 0 }} />
                }
              </button>
              {expanded && (
                <div className="ml-8 mr-2 mb-1">
                  {item.children.map(child => {
                    const childActive = matchHref(pathname, child.href)
                    return (
                      <Link key={child.href} href={child.href}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
                        style={{
                          backgroundColor: childActive ? '#FFF9E0' : 'transparent',
                          color: childActive ? '#D4A900' : '#444',
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
                  <button onClick={() => { setSelectedLocation('All Locations'); localStorage.setItem('selectedLocation', 'All Locations'); window.dispatchEvent(new Event('storage')); setLocationDropdown(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: selectedLocation === 'All Locations' ? '#D4A900' : '#1A1A1A', fontWeight: selectedLocation === 'All Locations' ? 600 : 400 }}>
                    All Locations
                  </button>
                  {locations.map(loc => (
                    <button key={loc.id} onClick={() => { setSelectedLocation(loc.name); localStorage.setItem('selectedLocation', loc.name); window.dispatchEvent(new Event('storage')); setLocationDropdown(false) }}
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

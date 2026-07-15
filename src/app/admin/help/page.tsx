'use client'
import { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

type Feature = { name: string; desc: string; badge?: string }
type Section = { icon: string; title: string; color: string; features: Feature[] }

const sections: Section[] = [
  {
    icon: '🍽️',
    title: 'Menu Management',
    color: '#FAEEDA',
    features: [
      { name: 'Add / Edit Menu Items', desc: 'Create items with name, description, price, category and image. Images are auto-compressed on upload to keep the site fast.' },
      { name: 'Customization Templates', desc: 'Save reusable option sets (sauces, add-ons, removals). Use the Quick Add button inside any menu item to apply a template instantly.', badge: 'New' },
      { name: 'Category Order', desc: 'Use arrows to set the display order of menu category tabs on the customer site. Changes take effect immediately after saving.', badge: 'New' },
      { name: 'Populars', desc: 'Mark items as popular — they appear in the featured section on the homepage.' },
      { name: 'Specials', desc: 'Highlight special items. They appear with a special badge on the menu page.' },
      { name: 'Price Settings', desc: 'Manage prices across all menu items from one place.' },
    ]
  },
  {
    icon: '📦',
    title: 'Orders',
    color: '#E6F1FB',
    features: [
      { name: 'Realtime Orders', desc: 'Live order feed that updates automatically. Change order status: Pending → Confirmed → Preparing → Ready → Delivered. Customer gets notified on each update.' },
      { name: 'Kitchen Display (KDS)', desc: 'Simplified view for kitchen staff. Shows active orders only — no pricing, just items and status.' },
      { name: 'Location Filter', desc: 'Use the "All Locations" dropdown at the top right to filter orders by restaurant location.' },
    ]
  },
  {
    icon: '📣',
    title: 'Marketing',
    color: '#EEEDFE',
    features: [
      { name: 'Coupons / Discount Codes', desc: 'Create promo codes with percent or fixed discount, minimum order value, expiry date and usage limits. Toggle active/inactive anytime.' },
      { name: 'Campaigns', desc: 'Send targeted promotions to customer segments. (Coming soon)' },
    ]
  },
  {
    icon: '⭐',
    title: 'Loyalty Program',
    color: '#EAF3DE',
    features: [
      { name: 'Loyalty Settings', desc: 'Set points per dollar spent, minimum points to redeem, redemption value, max discount percent and points expiry days.' },
      { name: 'First Order Bonus', desc: 'Set bonus points awarded to customers on their very first order to encourage repeat visits.' },
      { name: 'Customer Points', desc: 'View and manually adjust loyalty points for individual customers.' },
    ]
  },
  {
    icon: '⚙️',
    title: 'Settings',
    color: '#E1F5EE',
    features: [
      { name: 'Brand Settings', desc: 'Update business name, tagline, logo, primary color and contact details. All changes reflect on the customer site instantly.' },
      { name: 'Hero Images', desc: 'Upload up to 4 hero/gallery images shown on the homepage. Images are auto-compressed. Recommended size: 1200×800px.' },
      { name: 'Opening Hours', desc: 'Set opening hours shown in the site footer. Example: Mon–Thu: 11am–10pm.' },
      { name: 'Delivery Toggle', desc: 'Enable or disable delivery ordering with one click. When disabled, customers see a "Coming Soon" message instead.', badge: 'New' },
      { name: 'Change Password', desc: 'Update your admin panel login password from the Settings page.' },
    ]
  },
  {
    icon: '🛵',
    title: 'Delivery & Pickup',
    color: '#FCEBEB',
    features: [
      { name: 'Delivery Settings', desc: 'Configure delivery fee, minimum order value and estimated delivery time shown to customers.' },
      { name: 'Delivery Zones', desc: 'Define delivery zones by suburb or postcode. Orders outside the zone are automatically declined.' },
      { name: 'Pickup Settings', desc: 'Set estimated pickup time per location. Shown to customers at checkout.' },
    ]
  },
  {
    icon: '📊',
    title: 'Reporting Dashboard',
    color: '#F1EFE8',
    features: [
      { name: 'Revenue Analysis', desc: 'Weekly revenue charts broken down by channel — direct orders, Uber Eats, DoorDash, Menulog. Compare weeks side by side.' },
      { name: 'Weekly Details', desc: 'Detailed weekly breakdown by location. Filter by date range or location.' },
      { name: 'Data Input', desc: 'Enter weekly sales data manually or upload a CSV file. Smart column mapping handles different file formats automatically.' },
    ]
  },
  {
    icon: '🌐',
    title: 'Customer Portal',
    color: '#E6F1FB',
    features: [
      { name: 'Homepage', desc: 'Hero section, featured items and promotions are all pulled from admin settings automatically. No code changes needed.' },
      { name: 'Menu Page', desc: 'Shows all available items grouped by category. Category order is controlled from Admin → Menu → Category Order.' },
      { name: 'Checkout & Payments', desc: 'Stripe live payment processing. GST (10%) is calculated automatically. Customers can apply coupon codes or redeem loyalty points.' },
      { name: 'My Account', desc: 'Customers can view their Food Passport (loyalty level), achievement badges, order history and profile details.' },
      { name: 'Google Login', desc: 'Customers can sign in with Google. OTP email verification is required for email/password login.' },
    ]
  },
  {
    icon: '🏗️',
    title: 'Platform & Architecture',
    color: '#F1EFE8',
    features: [
      { name: 'Multi-Tenant', desc: 'This platform supports multiple restaurant brands. Each restaurant has its own restaurant_id. Moyuri Restaurant is already configured as restaurant_id=2.' },
      { name: 'Auto Deploy', desc: 'Any code change pushed to GitHub automatically deploys to Vercel within 1–2 minutes. No manual steps needed.' },
      { name: 'Image Compression', desc: 'All images uploaded via the admin panel are automatically compressed and converted to WebP format before uploading to storage.' },
      { name: 'Security (RLS)', desc: 'Row Level Security is enabled on all database tables. Each restaurant can only access its own data.' },
    ]
  },
]

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map(s => [s.title, true]))
  )

  const toggle = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const filtered = sections.map(s => ({
    ...s,
    features: s.features.filter(f =>
      search === '' ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.desc.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(s => s.features.length > 0)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>Help & Documentation</h2>
        <p className="text-sm" style={{ color: '#888' }}>Everything you need to know about managing your platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { num: '9', label: 'Sections' },
          { num: '35+', label: 'Features documented' },
          { num: '3', label: 'Platforms' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: '#f9f9f9', border: '1px solid #f0f0f0' }}>
            <div className="text-2xl font-black" style={{ color: '#1A1A1A' }}>{s.num}</div>
            <div className="text-xs mt-1" style={{ color: '#888' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6" style={{ border: '1px solid #e5e5e5', background: 'white' }}>
        <Search size={16} style={{ color: '#aaa' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search features, settings, how-to..."
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: '#1A1A1A' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#aaa', background: '#f5f5f5' }}>clear</button>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filtered.map(section => (
          <div key={section.title} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
            <button onClick={() => toggle(section.title)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left"
              style={{ background: '#f9f9f9' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: section.color }}>
                {section.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{section.title}</div>
              </div>
              <div className="text-xs mr-2" style={{ color: '#aaa' }}>{section.features.length} features</div>
              {openSections[section.title]
                ? <ChevronUp size={16} style={{ color: '#aaa' }} />
                : <ChevronDown size={16} style={{ color: '#aaa' }} />
              }
            </button>

            {openSections[section.title] && (
              <div>
                {section.features.map((f, i) => (
                  <div key={i} className="flex gap-3 px-5 py-3.5" style={{ borderTop: '1px solid #f0f0f0' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#ddd' }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-0.5 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
                        {f.name}
                        {f.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: '#EAF3DE', color: '#3B6D11' }}>
                            {f.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: '#888' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: '#aaa' }}>
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">No results for "{search}"</div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-8 p-4 rounded-2xl text-center" style={{ background: '#FFF9E0', border: '1px solid #F5C800' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: '#7A5F00' }}>Need help with something not listed here?</div>
        <div className="text-xs" style={{ color: '#B8960A' }}>Contact MS IT Solution for support and new feature requests.</div>
      </div>
    </div>
  )
}

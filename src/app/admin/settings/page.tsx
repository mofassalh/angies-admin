'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { Save, Upload } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [uploadingHero, setUploadingHero] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const heroRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const supabase = createClient()

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('restaurant_id', RESTAURANT_ID)
    const map: any = {}
    data?.forEach(row => { map[row.key] = row.value })
    setSettings(map)
    setLoading(false)
  }

  useEffect(() => { fetchSettings() }, [])

  const handleSave = async () => {
    setSaving(true)
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert(
        { key, value, restaurant_id: RESTAURANT_ID },
        { onConflict: 'key,restaurant_id' }
      )
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `logo_${RESTAURANT_ID}.${ext}`
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
      setSettings((s: any) => ({ ...s, logo_url: urlData.publicUrl }))
    }
    setUploading(false)
  }

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        canvas.toBlob(blob => resolve(blob!), 'image/webp', quality)
      }
      img.src = url
    })
  }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHero(index)
    const compressed = await compressImage(file)
    const fileName = `hero_${RESTAURANT_ID}_${index}.webp`
    const { error } = await supabase.storage.from('menu-images').upload(fileName, compressed, { upsert: true, contentType: 'image/webp' })
    if (!error) {
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
      const key = `hero_image${index}`
      setSettings((s: any) => ({ ...s, [key]: urlData.publicUrl }))
    }
    setUploadingHero(null)
  }

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) { setPasswordMsg({type:'error', text:'Please fill all fields'}); return }
    if (newPassword !== confirmPassword) { setPasswordMsg({type:'error', text:'Passwords do not match'}); return }
    if (newPassword.length < 6) { setPasswordMsg({type:'error', text:'Password must be at least 6 characters'}); return }
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({type:'error', text: error.message})
    } else {
      setPasswordMsg({type:'success', text:'Password changed successfully!'})
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordSaving(false)
    setTimeout(() => setPasswordMsg(null), 3000)
  }

  if (loading) return <p className="text-sm" style={{ color: '#aaa' }}>Loading...</p>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Settings</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Manage your business settings</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: saved ? '#22c55e' : '#F5C800', color: '#1A1A1A' }}>
          <Save size={16} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Branding */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Branding</h3>
        <div className="mb-4">
          <label className="text-sm mb-2 block" style={{ color: '#555' }}>Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: '#f5f5f5', border: '1px solid #e5e5e5' }}>
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl">🍽️</span>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ border: '1px solid #e5e5e5', color: '#555' }}>
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Business Name</label>
            <input value={settings.business_name || ''}
              onChange={e => setSettings((s: any) => ({ ...s, business_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Tagline</label>
            <input value={settings.tagline || ''}
              onChange={e => setSettings((s: any) => ({ ...s, tagline: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={settings.primary_color || '#F5C800'}
                onChange={e => setSettings((s: any) => ({ ...s, primary_color: e.target.value }))}
                className="w-12 h-10 rounded-lg cursor-pointer border-0 outline-none"
                style={{ border: '1px solid #e5e5e5' }} />
              <input value={settings.primary_color || ''}
                onChange={e => setSettings((s: any) => ({ ...s, primary_color: e.target.value }))}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none font-mono"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
              <div className="w-10 h-10 rounded-xl"
                style={{ backgroundColor: settings.primary_color || '#F5C800' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Images */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Hero Images</h3>
        <p className="text-xs mb-4" style={{ color: '#888' }}>4 images shown on homepage. First image is the main large image.</p>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <label className="text-sm mb-2 block" style={{ color: '#555' }}>Image {i} {i === 1 ? '(Main)' : ''}</label>
              <div className="relative w-full h-32 rounded-xl overflow-hidden"
                style={{ backgroundColor: '#f5f5f5', border: '1px solid #e5e5e5' }}>
                {settings[`hero_image${i}`] ? (
                  <img src={settings[`hero_image${i}`]} alt={`hero ${i}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">🖼️</span>
                  </div>
                )}
              </div>
              <button onClick={() => heroRefs[i-1].current?.click()}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ border: '1px solid #e5e5e5', color: '#555' }}>
                <Upload size={14} />
                {uploadingHero === i ? 'Uploading...' : 'Upload'}
              </button>
              <input ref={heroRefs[i-1]} type="file" accept="image/*" className="hidden"
                onChange={e => handleHeroUpload(e, i)} />
            </div>
          ))}
        </div>
      </div>

      {/* Hero Text */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Hero Section Text</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Badge Text (top pill)</label>
            <input value={settings.hero_badge || ''}
              onChange={e => setSettings((s: any) => ({ ...s, hero_badge: e.target.value }))}
              placeholder="100% Halal · 3 Melbourne locations"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#555' }}>Title Line 1</label>
              <input value={settings.hero_title1 || ''}
                onChange={e => setSettings((s: any) => ({ ...s, hero_title1: e.target.value }))}
                placeholder="Fresh &"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#555' }}>Title Line 2 (colored)</label>
              <input value={settings.hero_title2 || ''}
                onChange={e => setSettings((s: any) => ({ ...s, hero_title2: e.target.value }))}
                placeholder="Flavourful"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#555' }}>Title Line 3</label>
              <input value={settings.hero_title3 || ''}
                onChange={e => setSettings((s: any) => ({ ...s, hero_title3: e.target.value }))}
                placeholder="Every Time"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#555' }}>Locations Count</label>
              <input value={settings.location_count || ''}
                onChange={e => setSettings((s: any) => ({ ...s, location_count: e.target.value }))}
                placeholder="3"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#555' }}>Menu Items Count</label>
              <input value={settings.menu_item_count || ''}
                onChange={e => setSettings((s: any) => ({ ...s, menu_item_count: e.target.value }))}
                placeholder="50+"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#555' }}>Rating</label>
              <input value={settings.hero_rating || ''}
                onChange={e => setSettings((s: any) => ({ ...s, hero_rating: e.target.value }))}
                placeholder="4.8★"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
            </div>
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Popular Item Name</label>
            <input value={settings.popular_item || ''}
              onChange={e => setSettings((s: any) => ({ ...s, popular_item: e.target.value }))}
              placeholder="Kebab Plate"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Contact</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Phone</label>
            <input value={settings.phone || ''}
              onChange={e => setSettings((s: any) => ({ ...s, phone: e.target.value }))}
              placeholder="+61 3 XXXX XXXX"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Email</label>
            <input value={settings.email || ''}
              onChange={e => setSettings((s: any) => ({ ...s, email: e.target.value }))}
              placeholder="hello@restaurant.com"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
        </div>
      </div>

      {/* Social */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Social Media</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Facebook URL</label>
            <input value={settings.facebook || ''}
              onChange={e => setSettings((s: any) => ({ ...s, facebook: e.target.value }))}
              placeholder="https://facebook.com/yourpage"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Instagram URL</label>
            <input value={settings.instagram || ''}
              onChange={e => setSettings((s: any) => ({ ...s, instagram: e.target.value }))}
              placeholder="https://instagram.com/yourpage"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
        </div>
      </div>

      {/* Promotions */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>Promotional Banner</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#888' }}>
              {settings.promo_enabled === 'true' ? 'Visible' : 'Hidden'}
            </span>
            <button
              onClick={() => setSettings((s: any) => ({ ...s, promo_enabled: s.promo_enabled === 'true' ? 'false' : 'true' }))}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ backgroundColor: settings.promo_enabled === 'true' ? '#F5C800' : '#e5e5e5' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: settings.promo_enabled === 'true' ? '24px' : '4px' }} />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Title</label>
            <input value={settings.promo_title || ''}
              onChange={e => setSettings((s: any) => ({ ...s, promo_title: e.target.value }))}
              placeholder="Free Delivery on Your First Order!"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Subtitle</label>
            <input value={settings.promo_subtitle || ''}
              onChange={e => setSettings((s: any) => ({ ...s, promo_subtitle: e.target.value }))}
              placeholder="Sign up today and enjoy free delivery on your first order."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Button Text</label>
            <input value={settings.promo_button_text || ''}
              onChange={e => setSettings((s: any) => ({ ...s, promo_button_text: e.target.value }))}
              placeholder="Order Now & Save"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Button Link</label>
            <input value={settings.promo_button_link || ''}
              onChange={e => setSettings((s: any) => ({ ...s, promo_button_link: e.target.value }))}
              placeholder="/menu"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Emoji</label>
            <input value={settings.promo_emoji || ''}
              onChange={e => setSettings((s: any) => ({ ...s, promo_emoji: e.target.value }))}
              placeholder="🎁"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Change Password</h3>
        {passwordMsg && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: passwordMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: passwordMsg.type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${passwordMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
            {passwordMsg.text}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="text-sm mb-1 block" style={{ color: '#555' }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
          </div>
          <button onClick={handlePasswordChange} disabled={passwordSaving}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold" style={{ color: '#1A1A1A' }}>Delivery</h3>
            <p className="text-sm mt-1" style={{ color: '#888' }}>Enable or disable delivery ordering for customers</p>
          </div>
          <button
            onClick={() => setSettings((s: any) => ({ ...s, delivery_enabled: s.delivery_enabled === 'true' ? 'false' : 'true' }))}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ backgroundColor: settings.delivery_enabled === 'true' ? '#F5C800' : '#e5e5e5' }}>
            <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: settings.delivery_enabled === 'true' ? '24px' : '4px' }} />
          </button>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Opening Hours</h3>
        <div>
          <label className="text-sm mb-1 block" style={{ color: '#555' }}>Hours (shown in footer)</label>
          <textarea value={settings.opening_hours || ''}
            onChange={e => setSettings((s: any) => ({ ...s, opening_hours: e.target.value }))}
            placeholder={"Mon – Thu: 11am – 10pm\nFri – Sat: 11am – 11pm\nSunday: 12pm – 10pm"}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ border: '1px solid #e5e5e5', color: '#1A1A1A' }} />
        </div>
      </div>
    </div>
  )
}

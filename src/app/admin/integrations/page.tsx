'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RESTAURANT_ID } from '@/lib/restaurant'
import { Save, CheckCircle, XCircle } from 'lucide-react'

const integrations = [
  {
    id: 'stripe',
    name: 'Stripe',
    emoji: '💳',
    description: 'Accept card payments online',
    fields: [
      { key: 'stripe_publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...' },
      { key: 'stripe_secret_key', label: 'Secret Key', placeholder: 'sk_live_...', secret: true },
    ]
  },
  {
    id: 'uber_direct',
    name: 'Uber Direct',
    emoji: '🚗',
    description: 'On-demand delivery via Uber',
    fields: [
      { key: 'uber_client_id', label: 'Client ID', placeholder: 'Enter Uber Client ID' },
      { key: 'uber_client_secret', label: 'Client Secret', placeholder: 'Enter Uber Client Secret', secret: true },
      { key: 'uber_customer_id', label: 'Customer ID', placeholder: 'Enter Uber Customer ID' },
    ]
  },
  {
    id: 'doordash',
    name: 'DoorDash Drive',
    emoji: '🛵',
    description: 'On-demand delivery via DoorDash',
    fields: [
      { key: 'doordash_developer_id', label: 'Developer ID', placeholder: 'Enter DoorDash Developer ID' },
      { key: 'doordash_key_id', label: 'Key ID', placeholder: 'Enter DoorDash Key ID' },
      { key: 'doordash_signing_secret', label: 'Signing Secret', placeholder: 'Enter Signing Secret', secret: true },
    ]
  },
  {
    id: 'twilio',
    name: 'Twilio SMS',
    emoji: '📱',
    description: 'Send SMS notifications to customers',
    fields: [
      { key: 'twilio_account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxx' },
      { key: 'twilio_auth_token', label: 'Auth Token', placeholder: 'Enter Auth Token', secret: true },
      { key: 'twilio_phone_number', label: 'Phone Number', placeholder: '+61400000000' },
    ]
  },
  {
    id: 'xero',
    name: 'Xero',
    emoji: '📊',
    description: 'Sync orders with Xero accounting',
    fields: [
      { key: 'xero_client_id', label: 'Client ID', placeholder: 'Enter Xero Client ID' },
      { key: 'xero_client_secret', label: 'Client Secret', placeholder: 'Enter Xero Client Secret', secret: true },
    ]
  },
]

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('settings').select('*').eq('restaurant_id', RESTAURANT_ID)
      const map: any = {}
      data?.forEach(row => { map[row.key] = row.value })
      setSettings(map)
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSave = async (integrationId: string, fields: any[]) => {
    setSaving(integrationId)
    for (const field of fields) {
      if (settings[field.key] !== undefined) {
        await supabase.from('settings').upsert(
          { key: field.key, value: settings[field.key], restaurant_id: RESTAURANT_ID },
          { onConflict: 'key,restaurant_id' }
        )
      }
    }
    setSaving(null)
    setSaved(integrationId)
    setTimeout(() => setSaved(null), 2000)
  }

  const isConnected = (fields: any[]) => fields.every(f => settings[f.key] && settings[f.key].length > 0)

  if (loading) return <p className="text-sm" style={{ color: '#aaa' }}>Loading...</p>

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Integrations</h2>
        <p className="text-sm mt-1" style={{ color: '#888' }}>Connect third-party services to your restaurant</p>
      </div>

      <div className="space-y-4">
        {integrations.map(integration => (
          <div key={integration.id} className="rounded-2xl p-6"
            style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.emoji}</span>
                <div>
                  <div className="font-semibold" style={{ color: '#1A1A1A' }}>{integration.name}</div>
                  <div className="text-xs" style={{ color: '#888' }}>{integration.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected(integration.fields) ? (
                  <div className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <CheckCircle size={12} />
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: '#f5f5f5', color: '#aaa' }}>
                    <XCircle size={12} />
                    Not connected
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {integration.fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#555' }}>{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.secret && !showSecret[field.key] ? 'password' : 'text'}
                      value={settings[field.key] || ''}
                      onChange={e => setSettings((s: any) => ({ ...s, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid #e5e5e5', color: '#1A1A1A', paddingRight: field.secret ? '80px' : '16px' }}
                    />
                    {field.secret && (
                      <button
                        onClick={() => setShowSecret(s => ({ ...s, [field.key]: !s[field.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                        style={{ color: '#aaa' }}>
                        {showSecret[field.key] ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSave(integration.id, integration.fields)}
              disabled={saving === integration.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: saved === integration.id ? '#22c55e' : '#F5C800', color: '#1A1A1A' }}>
              <Save size={14} />
              {saving === integration.id ? 'Saving...' : saved === integration.id ? 'Saved!' : 'Save'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

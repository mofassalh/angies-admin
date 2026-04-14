import { createClient } from '@/lib/supabase'

export async function getCurrentStaff() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  return data
}

export function hasPermission(staff: any, permission: string) {
  if (!staff) return false
  if (staff.role === 'owner') return true
  return staff.permissions?.[permission] === true
}

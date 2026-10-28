// Store open/closed logic — shared by the website UI and the payment API.
// Hours are stored per location in `locations.opening_hours` (JSON) and
// `locations.is_open` is the manual on/off switch in admin.

export const STORE_TIMEZONE = 'Australia/Melbourne'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type DayHours = { open: string; close: string; closed: boolean }
type Hours = Record<string, DayHours>

export type StoreLocation = {
  id?: string
  name?: string
  is_open?: boolean | null
  opening_hours?: any
}

export type StoreStatus = {
  open: boolean
  reason: 'open' | 'paused' | 'outside_hours'
  message: string // short customer-facing text
}

function parseHours(raw: any): Hours | null {
  if (!raw) return null
  try {
    const h = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!h || typeof h !== 'object' || Object.keys(h).length === 0) return null
    return h as Hours
  } catch {
    return null
  }
}

function toMinutes(t: string): number {
  const [hh, mm] = (t || '0:0').split(':').map(n => parseInt(n, 10) || 0)
  return hh * 60 + mm
}

// Current weekday (0=Sun) and minutes since midnight in Melbourne
function melbourneNow(now: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: STORE_TIMEZONE,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''
  const day = DAYS.indexOf(get('weekday'))
  const minutes = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10)
  return { day: day < 0 ? 0 : day, minutes }
}

function isOvernight(d: DayHours) {
  return toMinutes(d.close) <= toMinutes(d.open)
}

function openByHours(hours: Hours, now: Date): boolean {
  const { day, minutes } = melbourneNow(now)
  const today = hours[DAYS[day]]
  const yesterday = hours[DAYS[(day + 6) % 7]]

  if (today && !today.closed) {
    const o = toMinutes(today.open)
    const c = toMinutes(today.close)
    if (!isOvernight(today) && minutes >= o && minutes < c) return true
    if (isOvernight(today) && minutes >= o) return true
  }
  // Late-night trading that started yesterday (e.g. Thu 11:00 → Fri 04:00)
  if (yesterday && !yesterday.closed && isOvernight(yesterday)) {
    if (minutes < toMinutes(yesterday.close)) return true
  }
  return false
}

function formatTime(t: string) {
  const m = toMinutes(t)
  const h = Math.floor(m / 60)
  const mm = m % 60
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return mm === 0 ? `${h12}${suffix}` : `${h12}:${String(mm).padStart(2, '0')}${suffix}`
}

function nextOpening(hours: Hours, now: Date): string | null {
  const { day, minutes } = melbourneNow(now)
  for (let i = 0; i < 8; i++) {
    const idx = (day + i) % 7
    const d = hours[DAYS[idx]]
    if (!d || d.closed) continue
    if (i === 0 && toMinutes(d.open) <= minutes) continue
    const label = i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAYS[idx]
    return `${label} at ${formatTime(d.open)}`
  }
  return null
}

export function getStoreStatus(loc: StoreLocation | null | undefined, now: Date = new Date()): StoreStatus {
  if (!loc) return { open: true, reason: 'open', message: '' }

  if (loc.is_open === false) {
    return {
      open: false,
      reason: 'paused',
      message: 'This store is not taking online orders right now.',
    }
  }

  const hours = parseHours(loc.opening_hours)
  if (!hours) return { open: true, reason: 'open', message: '' } // no hours set → don't block

  if (openByHours(hours, now)) return { open: true, reason: 'open', message: '' }

  const next = nextOpening(hours, now)
  return {
    open: false,
    reason: 'outside_hours',
    message: next ? `Closed now. Opens ${next}.` : 'Closed now.',
  }
}

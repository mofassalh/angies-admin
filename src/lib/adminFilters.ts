'use client'
// Shared filters for admin pages: the top-bar location + a date range,
// always counted in Melbourne time (where the stores are), no matter
// where the admin is opened from.
import { useEffect, useState } from 'react'

export const TZ = 'Australia/Melbourne'
export const ALL_LOCATIONS = 'All Locations'

// orders.created_at is stored in UTC without a "Z" — read it as UTC.
export function toDate(ts: string | null | undefined): Date {
  if (!ts) return new Date(0)
  const s = String(ts).replace(' ', 'T')
  return new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z')
}

// Melbourne calendar parts for a moment
function melParts(d: Date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d)
  const g = (t: string) => parseInt(p.find(x => x.type === t)?.value || '0', 10)
  return { y: g('year'), m: g('month'), d: g('day'), h: g('hour') % 24, mi: g('minute'), s: g('second') }
}

// The real moment when a Melbourne calendar day starts
export function melMidnight(y: number, m: number, d: number): Date {
  const guess = Date.UTC(y, m - 1, d)
  const p = melParts(new Date(guess))
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s)
  const offset = asUtc - guess
  return new Date(guess - offset)
}

export function melToday() {
  const p = melParts(new Date())
  return { y: p.y, m: p.m, d: p.d }
}

// Start of the Melbourne day `daysAgo` days back (0 = today)
export function melDayStart(daysAgo = 0): Date {
  const t = melToday()
  const base = new Date(Date.UTC(t.y, t.m - 1, t.d - daysAgo))
  return melMidnight(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate())
}

export function melHour(d: Date) { return melParts(d).h }

export function melDayLabel(d: Date, opts: Intl.DateTimeFormatOptions = { weekday: 'short' }) {
  return d.toLocaleDateString('en-AU', { timeZone: TZ, ...opts })
}

export type RangeKey = 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'all' | 'custom'

export const RANGE_OPTIONS: { value: RangeKey, label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom dates' },
]

export function rangeLabel(r: RangeKey) {
  return RANGE_OPTIONS.find(o => o.value === r)?.label || ''
}

// [from, to) for a range. from = null means no lower limit.
export function rangeBounds(r: RangeKey, fromDate?: string, toDateStr?: string): { from: Date | null, to: Date | null } {
  if (r === 'today') return { from: melDayStart(0), to: null }
  if (r === 'yesterday') return { from: melDayStart(1), to: melDayStart(0) }
  if (r === '7days') return { from: melDayStart(6), to: null }
  if (r === '30days') return { from: melDayStart(29), to: null }
  if (r === 'month') { const t = melToday(); return { from: melMidnight(t.y, t.m, 1), to: null } }
  if (r === 'custom' && fromDate) {
    const [fy, fm, fd] = fromDate.split('-').map(Number)
    const from = melMidnight(fy, fm, fd)
    let to: Date | null = null
    if (toDateStr) {
      const [ty, tm, td] = toDateStr.split('-').map(Number)
      const next = new Date(Date.UTC(ty, tm - 1, td + 1))
      to = melMidnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
    }
    return { from, to }
  }
  return { from: null, to: null }
}

export function inRange(ts: string, r: RangeKey, fromDate?: string, toDateStr?: string) {
  const { from, to } = rangeBounds(r, fromDate, toDateStr)
  const d = toDate(ts)
  if (from && d < from) return false
  if (to && d >= to) return false
  return true
}

export function matchesLocation(orderLocation: string | null | undefined, selected: string) {
  return selected === ALL_LOCATIONS || orderLocation === selected
}

// The location picked in the admin top bar (shared by every page)
export function useSelectedLocation() {
  const [loc, setLoc] = useState<string>(ALL_LOCATIONS)
  useEffect(() => {
    const read = () => { try { setLoc(localStorage.getItem('selectedLocation') || ALL_LOCATIONS) } catch {} }
    read()
    window.addEventListener('storage', read)
    return () => window.removeEventListener('storage', read)
  }, [])
  return loc
}

export function shortLocation(name: string) {
  return name === ALL_LOCATIONS ? 'All stores' : name.replace(/^Angie's Kebabs & Burgers\s*-\s*/, '')
}

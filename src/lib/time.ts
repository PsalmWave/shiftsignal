import type { ISODateTime } from '@/types/domain'

export function nowIso(): ISODateTime {
  return new Date().toISOString()
}

/** Local wall-clock date at a given hour offset from `base`. */
export function atHour(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base)
  d.setHours(hour, minute, 0, 0)
  return d
}

export function addMinutes(iso: ISODateTime | Date, minutes: number): Date {
  const d = iso instanceof Date ? new Date(iso) : new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return d
}

export function addHours(iso: ISODateTime | Date, hours: number): Date {
  return addMinutes(iso, hours * 60)
}

export function addDays(iso: ISODateTime | Date, days: number): Date {
  const d = iso instanceof Date ? new Date(iso) : new Date(iso)
  d.setDate(d.getDate() + days)
  return d
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export function formatTime(iso: ISODateTime | null | undefined): string {
  if (!iso) return '--'
  return timeFormatter.format(new Date(iso))
}

export function formatDate(iso: ISODateTime | null | undefined): string {
  if (!iso) return '--'
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: ISODateTime | null | undefined): string {
  if (!iso) return '--'
  return dateTimeFormatter.format(new Date(iso))
}

export function formatLongDate(iso: ISODateTime | null | undefined): string {
  if (!iso) return '--'
  return weekdayFormatter.format(new Date(iso))
}

/**
 * Converts an ISO timestamp into the `YYYY-MM-DDTHH:mm` shape that
 * `<input type="datetime-local">` expects, in local time.
 */
export function toLocalInputValue(iso: ISODateTime | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

/** Inverse of {@link toLocalInputValue}. Returns null for empty/invalid input. */
export function fromLocalInputValue(value: string): ISODateTime | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
]

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** e.g. "12 minutes ago", "in 3 hours". */
export function formatRelative(iso: ISODateTime | null | undefined, from: Date = new Date()): string {
  if (!iso) return '--'
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return '--'
  const diff = target - from.getTime()
  const abs = Math.abs(diff)

  if (abs < 60_000) return 'just now'

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (abs >= ms) {
      return relativeFormatter.format(Math.round(diff / ms), unit)
    }
  }
  return 'just now'
}

/** True when `iso` is in the past relative to `from`. */
export function isOverdue(iso: ISODateTime | null | undefined, from: Date = new Date()): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return !Number.isNaN(t) && t < from.getTime()
}

/** Groups a timestamp into a coarse bucket used by the activity feed. */
export function dayBucket(iso: ISODateTime, from: Date = new Date()): string {
  const d = new Date(iso)
  const startOfToday = atHour(from, 0)
  const startOfYesterday = addDays(startOfToday, -1)
  if (d >= startOfToday) return 'Today'
  if (d >= startOfYesterday) return 'Yesterday'
  return formatDate(iso)
}

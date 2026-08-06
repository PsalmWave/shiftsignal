import { describe, expect, it } from 'vitest'

import {
  addDays,
  addHours,
  atHour,
  dayBucket,
  formatRelative,
  fromLocalInputValue,
  isOverdue,
  toLocalInputValue,
} from './time'

const BASE = new Date(2026, 4, 12, 14, 30, 0)

describe('time helpers', () => {
  it('anchors a date to a given hour', () => {
    const result = atHour(BASE, 7)
    expect(result.getHours()).toBe(7)
    expect(result.getMinutes()).toBe(0)
    expect(result.getDate()).toBe(BASE.getDate())
  })

  it('adds hours and days without mutating the input', () => {
    const later = addHours(BASE, 3)
    expect(later.getHours()).toBe(17)
    expect(BASE.getHours()).toBe(14)

    const tomorrow = addDays(BASE, 1)
    expect(tomorrow.getDate()).toBe(BASE.getDate() + 1)
  })

  it('round-trips datetime-local input values in local time', () => {
    const iso = BASE.toISOString()
    const inputValue = toLocalInputValue(iso)
    expect(inputValue).toBe('2026-05-12T14:30')
    expect(fromLocalInputValue(inputValue)).toBe(iso)
  })

  it('returns empty values for missing or invalid input', () => {
    expect(toLocalInputValue(null)).toBe('')
    expect(toLocalInputValue('not-a-date')).toBe('')
    expect(fromLocalInputValue('')).toBeNull()
    expect(fromLocalInputValue('nonsense')).toBeNull()
  })

  it('detects overdue timestamps relative to a reference time', () => {
    expect(isOverdue(addHours(BASE, -1).toISOString(), BASE)).toBe(true)
    expect(isOverdue(addHours(BASE, 1).toISOString(), BASE)).toBe(false)
    expect(isOverdue(null, BASE)).toBe(false)
  })

  it('formats relative time in both directions', () => {
    expect(formatRelative(addHours(BASE, -2).toISOString(), BASE)).toMatch(/2 hours ago/i)
    expect(formatRelative(addHours(BASE, 3).toISOString(), BASE)).toMatch(/in 3 hours/i)
    expect(formatRelative(BASE.toISOString(), BASE)).toBe('just now')
    expect(formatRelative(null)).toBe('--')
  })

  it('buckets activity timestamps by day', () => {
    expect(dayBucket(BASE.toISOString(), BASE)).toBe('Today')
    expect(dayBucket(addHours(BASE, -20).toISOString(), BASE)).toBe('Yesterday')
    expect(dayBucket(addDays(BASE, -5).toISOString(), BASE)).not.toBe('Today')
  })
})

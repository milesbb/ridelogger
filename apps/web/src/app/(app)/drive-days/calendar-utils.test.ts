import { describe, it, expect } from 'vitest'
import { buildCalendarGrid, formatMonthLabel, groupByIsoDate } from './calendar-utils'
import type { DriveDaySummary } from '@/lib/api/types'

const base: DriveDaySummary = {
  id: '', user_id: '', date: '', start_time: null,
  passenger_names: [], total_km: 0, total_min: 0,
  passenger_km: 0, passenger_min: 0, created_at: '', updated_at: '',
}

describe('buildCalendarGrid', () => {
  it('returns exactly 6 rows of 7 cells', () => {
    const grid = buildCalendarGrid(2026, 4) // May 2026
    expect(grid).toHaveLength(6)
    for (const row of grid) {
      expect(row).toHaveLength(7)
    }
  })

  it('May 2026 starts on Friday: first 4 cells are padding, 5th is May 1', () => {
    const grid = buildCalendarGrid(2026, 4)
    const flat = grid.flat()
    expect(flat[0].isCurrentMonth).toBe(false)
    expect(flat[1].isCurrentMonth).toBe(false)
    expect(flat[2].isCurrentMonth).toBe(false)
    expect(flat[3].isCurrentMonth).toBe(false)
    expect(flat[4].isCurrentMonth).toBe(true)
    expect(flat[4].dayOfMonth).toBe(1)
    expect(flat[4].isoDate).toBe('2026-05-01')
  })

  it('marks Saturday (col 5) as weekend', () => {
    const grid = buildCalendarGrid(2026, 4)
    for (const row of grid) {
      expect(row[5].isWeekend).toBe(true)
    }
  })

  it('marks Sunday (col 6) as weekend', () => {
    const grid = buildCalendarGrid(2026, 4)
    for (const row of grid) {
      expect(row[6].isWeekend).toBe(true)
    }
  })

  it('does not mark weekday columns (0-4) as weekend', () => {
    const grid = buildCalendarGrid(2026, 4)
    for (const row of grid) {
      for (let col = 0; col <= 4; col++) {
        expect(row[col].isWeekend).toBe(false)
      }
    }
  })

  it('assigns correct isoDate for current month cells', () => {
    const grid = buildCalendarGrid(2026, 4)
    const flat = grid.flat()
    const may15 = flat.find((c) => c.isoDate === '2026-05-15')
    expect(may15).toBeDefined()
    expect(may15?.dayOfMonth).toBe(15)
    expect(may15?.isCurrentMonth).toBe(true)
  })

  it('padding cells have isoDate null', () => {
    const grid = buildCalendarGrid(2026, 4)
    const flat = grid.flat()
    expect(flat[0].isoDate).toBeNull()
  })

  it('handles a month that starts on Monday (no leading padding)', () => {
    // Find a month that starts on Monday — June 2026: getDay() = 1, offset = 0
    const grid = buildCalendarGrid(2026, 5) // June 2026
    const flat = grid.flat()
    expect(flat[0].isCurrentMonth).toBe(true)
    expect(flat[0].dayOfMonth).toBe(1)
    expect(flat[0].isoDate).toBe('2026-06-01')
  })
})

describe('formatMonthLabel', () => {
  it('formats January 2026 correctly', () => {
    expect(formatMonthLabel(2026, 0)).toBe('January 2026')
  })

  it('formats December 2025 correctly', () => {
    expect(formatMonthLabel(2025, 11)).toBe('December 2025')
  })
})

describe('groupByIsoDate', () => {
  it('groups a single day correctly', () => {
    const day = { ...base, id: 'd1', date: '2026-05-06' }
    const map = groupByIsoDate([day])
    expect(map.get('2026-05-06')).toEqual([day])
  })

  it('groups two days on the same date together', () => {
    const d1 = { ...base, id: 'd1', date: '2026-05-06' }
    const d2 = { ...base, id: 'd2', date: '2026-05-06' }
    const map = groupByIsoDate([d1, d2])
    expect(map.get('2026-05-06')).toHaveLength(2)
  })

  it('keeps different dates in separate keys', () => {
    const d1 = { ...base, id: 'd1', date: '2026-05-06' }
    const d2 = { ...base, id: 'd2', date: '2026-05-07' }
    const map = groupByIsoDate([d1, d2])
    expect(map.get('2026-05-06')).toHaveLength(1)
    expect(map.get('2026-05-07')).toHaveLength(1)
  })

  it('returns an empty map for empty input', () => {
    const map = groupByIsoDate([])
    expect(map.size).toBe(0)
  })
})

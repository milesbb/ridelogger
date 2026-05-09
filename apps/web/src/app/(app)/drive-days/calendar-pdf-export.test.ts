import { describe, it, expect } from 'vitest'
import { getMonthsInRange } from './calendar-pdf-export'

describe('getMonthsInRange', () => {
  it('returns 1 month for a range within a single month', () => {
    const result = getMonthsInRange('2026-01-01', '2026-01-31')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ year: 2026, month: 0 })
  })

  it('returns 1 month for a single day', () => {
    const result = getMonthsInRange('2026-05-15', '2026-05-15')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ year: 2026, month: 4 })
  })

  it('returns 3 months for a range spanning Jan to Mar', () => {
    const result = getMonthsInRange('2026-01-01', '2026-03-31')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ year: 2026, month: 0 })
    expect(result[1]).toEqual({ year: 2026, month: 1 })
    expect(result[2]).toEqual({ year: 2026, month: 2 })
  })

  it('handles a year boundary (Dec to Feb)', () => {
    const result = getMonthsInRange('2025-12-01', '2026-02-28')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ year: 2025, month: 11 })
    expect(result[1]).toEqual({ year: 2026, month: 0 })
    expect(result[2]).toEqual({ year: 2026, month: 1 })
  })

  it('returns months in order from start to end', () => {
    const result = getMonthsInRange('2026-03-01', '2026-06-30')
    const months = result.map((r) => r.month)
    expect(months).toEqual([2, 3, 4, 5])
  })
})

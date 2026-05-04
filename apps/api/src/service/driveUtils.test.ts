import { describe, it, expect } from 'vitest'
import { calculateRoundTrip } from './driveUtils'

describe('calculateRoundTrip', () => {
  it('doubles distance and duration', () => {
    const result = calculateRoundTrip({ distanceKm: 10, durationMin: 20 })
    expect(result.distanceKm).toBe(20)
    expect(result.durationMin).toBe(40)
  })

  it('rounds distance to 1 decimal place', () => {
    expect(calculateRoundTrip({ distanceKm: 3.33, durationMin: 10 }).distanceKm).toBe(6.7)
  })

  it('rounds duration to nearest whole minute', () => {
    expect(calculateRoundTrip({ distanceKm: 5, durationMin: 7 }).durationMin).toBe(14)
  })

  it('handles zero values', () => {
    const result = calculateRoundTrip({ distanceKm: 0, durationMin: 0 })
    expect(result.distanceKm).toBe(0)
    expect(result.durationMin).toBe(0)
  })

  it('handles fractional km correctly', () => {
    expect(calculateRoundTrip({ distanceKm: 8.4, durationMin: 18 }).distanceKm).toBe(16.8)
  })
})

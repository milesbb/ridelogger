import { describe, it, expect } from "vitest"
import { calculateRoundTrip, sumResults } from "@/lib/drive-utils"

describe("calculateRoundTrip", () => {
  it("doubles the distance and duration", () => {
    const result = calculateRoundTrip({ distanceKm: 8.4, durationMin: 18 })
    expect(result.distanceKm).toBe(16.8)
    expect(result.durationMin).toBe(36)
  })

  it("rounds distance to 1 decimal place", () => {
    const result = calculateRoundTrip({ distanceKm: 3.33, durationMin: 10 })
    expect(result.distanceKm).toBe(6.7)
  })

  it("handles zero values", () => {
    const result = calculateRoundTrip({ distanceKm: 0, durationMin: 0 })
    expect(result.distanceKm).toBe(0)
    expect(result.durationMin).toBe(0)
  })
})

describe("sumResults", () => {
  it("sums distance and duration across multiple passengers", () => {
    const results = [
      { distanceKm: 8.4, durationMin: 36 },
      { distanceKm: 12.2, durationMin: 28 },
    ]
    const total = sumResults(results)
    expect(total.distanceKm).toBe(20.6)
    expect(total.durationMin).toBe(64)
  })

  it("returns zero totals for an empty list", () => {
    const total = sumResults([])
    expect(total.distanceKm).toBe(0)
    expect(total.durationMin).toBe(0)
  })

  it("rounds the total distance to 1 decimal place", () => {
    const results = [
      { distanceKm: 1.1, durationMin: 5 },
      { distanceKm: 1.1, durationMin: 5 },
      { distanceKm: 1.1, durationMin: 5 },
    ]
    const total = sumResults(results)
    expect(total.distanceKm).toBe(3.3)
  })
})

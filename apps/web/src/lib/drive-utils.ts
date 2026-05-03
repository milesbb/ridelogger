export interface OneWayRoute {
  distanceKm: number
  durationMin: number
}

export interface RoundTripResult {
  distanceKm: number
  durationMin: number
}

export function calculateRoundTrip(oneWay: OneWayRoute): RoundTripResult {
  return {
    distanceKm: Math.round(oneWay.distanceKm * 2 * 10) / 10,
    durationMin: oneWay.durationMin * 2,
  }
}

export function sumResults(results: RoundTripResult[]): RoundTripResult {
  const totalKm = results.reduce((sum, r) => sum + r.distanceKm, 0)
  const totalMin = results.reduce((sum, r) => sum + r.durationMin, 0)
  return {
    distanceKm: Math.round(totalKm * 10) / 10,
    durationMin: totalMin,
  }
}

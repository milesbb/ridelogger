import type { RouteResult } from "@ridelogger/routing"

export function calculateRoundTrip(oneWay: RouteResult): { distanceKm: number; durationMin: number } {
  return {
    distanceKm: Math.round(oneWay.distanceKm * 2 * 10) / 10,
    durationMin: Math.round(oneWay.durationMin * 2),
  }
}

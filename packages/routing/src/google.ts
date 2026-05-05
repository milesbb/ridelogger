import type { Coords, RouteResult, RoutingService } from "./types"
import { RoutingError } from "./types"

const MAPS_BASE = "https://maps.googleapis.com/maps/api"

interface GeocodeResponse {
  status: string
  results: { geometry: { location: { lat: number; lng: number } } }[]
}

interface DirectionsResponse {
  status: string
  routes: { legs: { distance: { value: number }; duration: { value: number } }[] }[]
}

export function createGoogleService(apiKey?: string): RoutingService {
  const key = apiKey ?? process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new RoutingError("GOOGLE_MAPS_API_KEY is not set")

  return {
    async geocode(address: string): Promise<Coords> {
      const url = `${MAPS_BASE}/geocode/json?address=${encodeURIComponent(address)}&region=au&key=${key}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new RoutingError(`Google geocode failed: ${res.statusText}`, res.status)
      }
      const data = await res.json() as GeocodeResponse
      if (data.status === "ZERO_RESULTS" || !data.results?.[0]) {
        throw new RoutingError(`No geocode result for: ${address}`)
      }
      if (data.status !== "OK") {
        throw new RoutingError(`Google geocode error: ${data.status}`)
      }
      const { lat, lng } = data.results[0].geometry.location
      return { lat, lon: lng }
    },

    async getRoute(from: Coords, to: Coords): Promise<RouteResult> {
      const origin = `${from.lat},${from.lon}`
      const destination = `${to.lat},${to.lon}`
      const url = `${MAPS_BASE}/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${key}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new RoutingError(`Google directions failed: ${res.statusText}`, res.status)
      }
      const data = await res.json() as DirectionsResponse
      if (data.status === "ZERO_RESULTS" || !data.routes?.[0]) {
        throw new RoutingError("No route found")
      }
      if (data.status !== "OK") {
        throw new RoutingError(`Google directions error: ${data.status}`)
      }
      const leg = data.routes[0].legs[0]
      return {
        distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
        durationMin: Math.round(leg.duration.value / 60),
      }
    },
  }
}

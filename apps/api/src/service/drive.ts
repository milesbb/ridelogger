import { createRoutingService, type Coords } from "@ridelogger/routing"
import { getLocation } from "../data/locations"
import logger from "../utils/logging"
import { getRoutingApiKey, getRoutingProvider } from "../utils/routingKey"

export interface DriveLegInput {
  fromLocationId: string
  toLocationId: string
  label: string
}

export interface DriveLegResult {
  label: string
  distanceKm: number
  durationMin: number
  error?: string
}

export async function calculateDriveDay(
  userId: string,
  legs: DriveLegInput[],
): Promise<DriveLegResult[]> {
  const provider = getRoutingProvider()
  const apiKey = await getRoutingApiKey(provider)
  const routing = await createRoutingService(provider, apiKey, logger)

  return Promise.all(
    legs.map(async (leg): Promise<DriveLegResult> => {
      const [from, to] = await Promise.all([
        getLocation(leg.fromLocationId, userId),
        getLocation(leg.toLocationId, userId),
      ])

      if (!from) return { label: leg.label, distanceKm: 0, durationMin: 0, error: "Start location not found" }
      if (!to)   return { label: leg.label, distanceKm: 0, durationMin: 0, error: "End location not found" }

      if (!from.lat || !from.lon) return { label: leg.label, distanceKm: 0, durationMin: 0, error: `${from.name} is not geocoded — edit the location to fix` }
      if (!to.lat   || !to.lon)   return { label: leg.label, distanceKm: 0, durationMin: 0, error: `${to.name} is not geocoded — edit the location to fix` }

      try {
        const fromCoords: Coords = { lat: from.lat, lon: from.lon }
        const toCoords: Coords   = { lat: to.lat,   lon: to.lon }
        const route = await routing.getRoute(fromCoords, toCoords)
        return {
          label: leg.label,
          distanceKm: Math.round(route.distanceKm * 10) / 10,
          durationMin: Math.round(route.durationMin),
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Route calculation failed"
        return { label: leg.label, distanceKm: 0, durationMin: 0, error: message }
      }
    }),
  )
}

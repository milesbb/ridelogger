"use server"

import { createClient } from "@/lib/supabase/server"
import { createRoutingService, type Coords } from "@ridelogger/routing"
import { calculateRoundTrip } from "@/lib/drive-utils"

export interface DriveSegmentInput {
  passengerId: string
  destinationLocationId: string
}

export interface DriveSegmentResult {
  passengerId: string
  passengerName: string
  destinationName: string
  distanceKm: number
  durationMin: number
  error?: string
}

export async function calculateDriveDay(
  segments: DriveSegmentInput[],
): Promise<{ results: DriveSegmentResult[]; error: string | null }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { results: [], error: "Not authenticated" }

  const passengerIds = segments.map((s) => s.passengerId)
  const locationIds = segments.map((s) => s.destinationLocationId)

  const [{ data: passengers }, { data: locations }] = await Promise.all([
    supabase
      .from("passengers")
      .select("id, name, home_address, home_lat, home_lon")
      .eq("user_id", user.id)
      .in("id", passengerIds),
    supabase
      .from("locations")
      .select("id, name, address, lat, lon")
      .eq("user_id", user.id)
      .in("id", locationIds),
  ])

  const passengerMap = new Map(passengers?.map((p) => [p.id, p]) ?? [])
  const locationMap = new Map(locations?.map((l) => [l.id, l]) ?? [])

  const routing = await createRoutingService(
    (process.env.ROUTING_PROVIDER as "ors" | "google") ?? "ors",
  )

  const results: DriveSegmentResult[] = await Promise.all(
    segments.map(async (seg) => {
      const passenger = passengerMap.get(seg.passengerId)
      const destination = locationMap.get(seg.destinationLocationId)

      if (!passenger) {
        return { passengerId: seg.passengerId, passengerName: "Unknown", destinationName: "Unknown", distanceKm: 0, durationMin: 0, error: "Passenger not found" }
      }
      if (!destination) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: "Unknown", distanceKm: 0, durationMin: 0, error: "Destination not found" }
      }

      const from: Coords = { lat: passenger.home_lat!, lon: passenger.home_lon! }
      const to: Coords = { lat: destination.lat!, lon: destination.lon! }

      if (!from.lat || !from.lon) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: "Passenger address not geocoded — edit the passenger to fix" }
      }
      if (!to.lat || !to.lon) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: "Destination not geocoded — edit the location to fix" }
      }

      try {
        const route = await routing.getRoute(from, to)
        const roundTrip = calculateRoundTrip(route)
        return {
          passengerId: seg.passengerId,
          passengerName: passenger.name,
          destinationName: destination.name,
          ...roundTrip,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Route calculation failed"
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: message }
      }
    }),
  )

  return { results, error: null }
}

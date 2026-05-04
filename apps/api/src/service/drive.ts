import { createRoutingService, type Coords } from "@ridelogger/routing"
import { calculateRoundTrip } from "./driveUtils"
import { getPassenger } from "../data/passengers"
import { getLocation } from "../data/locations"

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
  userId: string,
  segments: DriveSegmentInput[],
): Promise<DriveSegmentResult[]> {
  const provider = (process.env.ROUTING_PROVIDER as "ors" | "google") ?? "ors"
  const routing = await createRoutingService(provider)

  return Promise.all(
    segments.map(async (seg): Promise<DriveSegmentResult> => {
      const passenger = await getPassenger(seg.passengerId, userId)
      if (!passenger) {
        return { passengerId: seg.passengerId, passengerName: "Unknown", destinationName: "Unknown", distanceKm: 0, durationMin: 0, error: "Passenger not found" }
      }

      const destination = await getLocation(seg.destinationLocationId, userId)
      if (!destination) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: "Unknown", distanceKm: 0, durationMin: 0, error: "Destination not found" }
      }

      if (!passenger.home_lat || !passenger.home_lon) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: "Passenger address not geocoded — edit the passenger to fix" }
      }

      if (!destination.lat || !destination.lon) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: "Destination not geocoded — edit the location to fix" }
      }

      try {
        const from: Coords = { lat: passenger.home_lat, lon: passenger.home_lon }
        const to: Coords = { lat: destination.lat, lon: destination.lon }
        const route = await routing.getRoute(from, to)
        return {
          passengerId: seg.passengerId,
          passengerName: passenger.name,
          destinationName: destination.name,
          ...calculateRoundTrip(route),
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Route calculation failed"
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: message }
      }
    }),
  )
}

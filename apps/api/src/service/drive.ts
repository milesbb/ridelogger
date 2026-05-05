import { createRoutingService, type Coords } from "@ridelogger/routing"
import { calculateRoundTrip } from "./driveUtils"
import { getPassenger } from "../data/passengers"
import { getLocation } from "../data/locations"
import logger from "../utils/logging"
import { getRoutingApiKey, getRoutingProvider } from "../utils/routingKey"

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
  const provider = getRoutingProvider()
  const apiKey = await getRoutingApiKey(provider)
  const routing = await createRoutingService(provider, apiKey, logger)

  return Promise.all(
    segments.map(async (seg): Promise<DriveSegmentResult> => {
      const passenger = await getPassenger(seg.passengerId, userId)
      if (!passenger) {
        return { passengerId: seg.passengerId, passengerName: "Unknown", destinationName: "Unknown", distanceKm: 0, durationMin: 0, error: "Passenger not found" }
      }

      const [homeLocation, destination] = await Promise.all([
        getLocation(passenger.home_location_id, userId),
        getLocation(seg.destinationLocationId, userId),
      ])

      if (!destination) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: "Unknown", distanceKm: 0, durationMin: 0, error: "Destination not found" }
      }

      if (!homeLocation || !homeLocation.lat || !homeLocation.lon) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: "Passenger home address not geocoded — edit the passenger to fix" }
      }

      if (!destination.lat || !destination.lon) {
        return { passengerId: seg.passengerId, passengerName: passenger.name, destinationName: destination.name, distanceKm: 0, durationMin: 0, error: "Destination not geocoded — edit the location to fix" }
      }

      try {
        const from: Coords = { lat: homeLocation.lat, lon: homeLocation.lon }
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

import { createRoutingService, type Coords } from "@ridelogger/routing"
import { getLocation } from "../data/locations"
import * as db from "../data/drive_days"
import logger from "../utils/logging"
import { getRoutingApiKey, getRoutingProvider } from "../utils/routingKey"
import { Errors } from "../utils/errorTypes"

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

export interface SaveLegInput {
  fromLocationId: string
  toLocationId: string
  passengerId: string | null
  label: string
  distanceKm: number
  durationMin: number
  isPassengerLeg: boolean
}

export interface SaveDriveDayInput {
  date: string
  startTime: string | null
  legs: SaveLegInput[]
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

export async function saveDriveDay(
  userId: string,
  input: SaveDriveDayInput,
): Promise<{ id: string }> {
  const day = await db.createDriveDay(userId, { date: input.date, startTime: input.startTime })
  await db.createLegs(
    input.legs.map((leg, i) => ({
      drive_day_id: day.id,
      user_id: userId,
      from_location_id: leg.fromLocationId,
      to_location_id: leg.toLocationId,
      passenger_id: leg.passengerId,
      label: leg.label,
      distance_km: leg.distanceKm,
      duration_min: leg.durationMin,
      is_passenger_leg: leg.isPassengerLeg,
      position: i,
    })),
  )
  return { id: day.id }
}

export async function listDriveDays(userId: string): Promise<db.DriveDaySummary[]> {
  return db.listDriveDays(userId)
}

export async function getPassengerDropoffs(
  userId: string,
  passengerId: string,
): ReturnType<typeof db.getPassengerDropoffHistory> {
  return db.getPassengerDropoffHistory(userId, passengerId, 5)
}

export async function exportDriveDays(
  userId: string,
  from: string,
  to: string,
): Promise<db.ExportLeg[]> {
  return db.getLegsForExport(userId, from, to)
}

export async function getSimilarDays(
  userId: string,
  date: string,
  limit = 3,
): Promise<db.DriveDaySummary[]> {
  return db.listSimilarDriveDays(userId, date, limit)
}

export async function getDriveDay(id: string, userId: string): Promise<db.DriveDayDetail> {
  const day = await db.getDriveDayWithLegs(id, userId)
  if (!day) throw Errors.NotFound("Drive day")
  return day
}

export async function deleteDriveDay(id: string, userId: string): Promise<void> {
  const deleted = await db.deleteDriveDay(id, userId)
  if (!deleted) throw Errors.NotFound("Drive day")
}

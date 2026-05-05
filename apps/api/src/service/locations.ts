import * as db from "../data/locations"
import { geocodeAddress } from "./geocode"
import { Errors } from "../utils/errorTypes"

export async function list(userId: string): Promise<db.Location[]> {
  return db.listLocations(userId)
}

export async function create(
  userId: string,
  input: { name: string; address: string },
): Promise<db.Location> {
  const coords = await geocodeAddress(input.address)
  return db.createLocation(userId, {
    name: input.name,
    address: input.address,
    lat: coords.lat,
    lon: coords.lon,
  })
}

export async function update(
  id: string,
  userId: string,
  input: { name: string; address: string },
): Promise<db.Location> {
  const coords = await geocodeAddress(input.address)
  const updated = await db.updateLocation(id, userId, {
    name: input.name,
    address: input.address,
    lat: coords.lat,
    lon: coords.lon,
  })
  if (!updated) throw Errors.NotFound("Location")
  return updated
}

export async function remove(id: string, userId: string): Promise<void> {
  const inUse = await db.isLocationReferenced(id, userId)
  if (inUse) throw Errors.Conflict("This location is saved as a home address — remove that reference first")
  const deleted = await db.deleteLocation(id, userId)
  if (!deleted) throw Errors.NotFound("Location")
}

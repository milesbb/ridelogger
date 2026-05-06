import * as db from "../data/locations"
import { findDriveDaysByLocation } from "../data/drive_days"
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
  const [inUse, driveDays] = await Promise.all([
    db.isLocationReferenced(id, userId),
    findDriveDaysByLocation(id, userId),
  ])
  if (inUse) throw Errors.Conflict("This location is saved as a home address — remove that reference first")
  if (driveDays.length > 0) {
    const MAX_SHOWN = 5
    const shown = driveDays.slice(0, MAX_SHOWN).map((d) => formatDate(d.date))
    const rest = driveDays.length - MAX_SHOWN
    const list = rest > 0 ? [...shown, `${rest} more…`] : shown
    throw Errors.Conflict(`This location is used in saved drive day(s): ${list.join(", ")}`)
  }
  const deleted = await db.deleteLocation(id, userId)
  if (!deleted) throw Errors.NotFound("Location")
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

import * as db from '../data/settings'
import * as locationDb from '../data/locations'
import { geocodeAddress } from './geocode'

export async function get(userId: string): Promise<db.AppSettings | null> {
  return db.getSettings(userId)
}

export async function upsert(
  userId: string,
  input: { homeAddress: string },
): Promise<db.AppSettings> {
  const coords = await geocodeAddress(input.homeAddress)
  const existing = await db.getSettings(userId)

  if (existing) {
    const currentLocation = await locationDb.getLocation(existing.home_location_id, userId)
    await locationDb.updateLocation(existing.home_location_id, userId, {
      name: currentLocation!.name,
      address: input.homeAddress,
      lat: coords.lat,
      lon: coords.lon,
    })
    return db.upsertSettings(userId, { home_location_id: existing.home_location_id })
  }

  const location = await locationDb.createLocation(userId, {
    name: 'Home',
    address: input.homeAddress,
    lat: coords.lat,
    lon: coords.lon,
  })
  return db.upsertSettings(userId, { home_location_id: location.id })
}

import * as db from "../data/settings"
import { geocodeAddress } from "./geocode"

export async function get(userId: string): Promise<db.AppSettings | null> {
  return db.getSettings(userId)
}

export async function upsert(
  userId: string,
  input: { homeAddress: string },
): Promise<db.AppSettings> {
  const coords = await geocodeAddress(input.homeAddress)
  return db.upsertSettings(userId, {
    home_address: input.homeAddress,
    home_lat: coords.lat,
    home_lon: coords.lon,
  })
}

import * as db from "../data/passengers"
import { geocodeAddress } from "./geocode"
import { Errors } from "../utils/errorTypes"

export async function list(userId: string): Promise<db.Passenger[]> {
  return db.listPassengers(userId)
}

export async function create(
  userId: string,
  input: { name: string; homeAddress: string; notes: string },
): Promise<db.Passenger> {
  const coords = await geocodeAddress(input.homeAddress)
  return db.createPassenger(userId, {
    name: input.name,
    home_address: input.homeAddress,
    home_lat: coords.lat,
    home_lon: coords.lon,
    notes: input.notes || null,
  })
}

export async function update(
  id: string,
  userId: string,
  input: { name: string; homeAddress: string; notes: string },
): Promise<db.Passenger> {
  const coords = await geocodeAddress(input.homeAddress)
  const updated = await db.updatePassenger(id, userId, {
    name: input.name,
    home_address: input.homeAddress,
    home_lat: coords.lat,
    home_lon: coords.lon,
    notes: input.notes || null,
  })
  if (!updated) throw Errors.NotFound("Passenger")
  return updated
}

export async function remove(id: string, userId: string): Promise<void> {
  const deleted = await db.deletePassenger(id, userId)
  if (!deleted) throw Errors.NotFound("Passenger")
}

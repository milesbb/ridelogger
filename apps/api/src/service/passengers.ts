import * as db from '../data/passengers'
import * as locationDb from '../data/locations'
import { insertAuditLog } from '../data/auditLogs'
import { geocodeAddress } from './geocode'
import { Errors } from '../utils/errorTypes'

type HomeUpdate =
  | { type: 'none' }
  | { type: 'edit'; address: string }
  | { type: 'switch'; locationId: string }

export async function list(userId: string): Promise<db.Passenger[]> {
  const passengers = await db.listPassengers(userId)
  await insertAuditLog(userId, 'view', 'passenger', null)
  return passengers
}

export async function create(
  userId: string,
  input: { name: string; homeAddress: string },
): Promise<db.Passenger> {
  const coords = await geocodeAddress(input.homeAddress)
  const location = await locationDb.createLocation(userId, {
    name: `${input.name}'s home`,
    address: input.homeAddress,
    lat: coords.lat,
    lon: coords.lon,
  })
  const passenger = await db.createPassenger(userId, {
    name: input.name,
    home_location_id: location.id,
  })
  await insertAuditLog(userId, 'create', 'passenger', passenger.id)
  return passenger
}

export async function update(
  id: string,
  userId: string,
  input: { name: string; homeUpdate: HomeUpdate },
): Promise<db.Passenger> {
  const existing = await db.getPassenger(id, userId)
  if (!existing) throw Errors.NotFound('Passenger')

  let homeLocationId = existing.home_location_id

  if (input.homeUpdate.type === 'edit') {
    const coords = await geocodeAddress(input.homeUpdate.address)
    const currentLocation = await locationDb.getLocation(homeLocationId, userId)
    await locationDb.updateLocation(homeLocationId, userId, {
      name: currentLocation!.name,
      address: input.homeUpdate.address,
      lat: coords.lat,
      lon: coords.lon,
    })
  } else if (input.homeUpdate.type === 'switch') {
    const newLocation = await locationDb.getLocation(input.homeUpdate.locationId, userId)
    if (!newLocation) throw Errors.NotFound('Location')
    homeLocationId = input.homeUpdate.locationId
  }

  const updated = await db.updatePassenger(id, userId, {
    name: input.name,
    home_location_id: homeLocationId,
  })
  if (!updated) throw Errors.NotFound('Passenger')
  await insertAuditLog(userId, 'update', 'passenger', id)
  return updated
}

export async function remove(
  id: string,
  userId: string,
  deleteHomeLocation: boolean,
): Promise<void> {
  const passenger = await db.getPassenger(id, userId)
  if (!passenger) throw Errors.NotFound('Passenger')

  const homeLocationId = passenger.home_location_id
  await db.deletePassenger(id, userId)
  await insertAuditLog(userId, 'delete', 'passenger', id)

  if (deleteHomeLocation) {
    await locationDb.deleteLocation(homeLocationId, userId)
  }
}

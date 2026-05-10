import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/passengers')
vi.mock('../data/locations')
vi.mock('../data/auditLogs')
vi.mock('./geocode')

import * as db from '../data/passengers'
import * as locationDb from '../data/locations'
import * as auditDb from '../data/auditLogs'
import * as geocode from './geocode'
import { list, create, update, remove } from './passengers'

const mockLocation = {
  id: 'loc-1',
  user_id: 'u-1',
  name: "Alice's home",
  address: '123 Main St',
  lat: -37.8,
  lon: 144.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockPassenger = {
  id: 'p-1',
  user_id: 'u-1',
  name: 'Alice',
  home_location_id: 'loc-1',
  home_address: '123 Main St',
  home_lat: -37.8,
  home_lon: 144.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auditDb.insertAuditLog).mockResolvedValue(undefined)
})

describe('list', () => {
  it('returns passengers from the data layer', async () => {
    vi.mocked(db.listPassengers).mockResolvedValue([mockPassenger])

    const result = await list('u-1')

    expect(result).toEqual([mockPassenger])
    expect(db.listPassengers).toHaveBeenCalledWith('u-1')
  })

  it('logs a view audit event', async () => {
    vi.mocked(db.listPassengers).mockResolvedValue([mockPassenger])

    await list('u-1')

    expect(auditDb.insertAuditLog).toHaveBeenCalledWith('u-1', 'view', 'passenger', null)
  })
})

describe('create', () => {
  it('geocodes the address, creates a location, then creates the passenger', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.8, lon: 144.9 })
    vi.mocked(locationDb.createLocation).mockResolvedValue(mockLocation)
    vi.mocked(db.createPassenger).mockResolvedValue(mockPassenger)

    const result = await create('u-1', { name: 'Alice', homeAddress: '123 Main St' })

    expect(geocode.geocodeAddress).toHaveBeenCalledWith('123 Main St')
    expect(locationDb.createLocation).toHaveBeenCalledWith('u-1', {
      name: "Alice's home",
      address: '123 Main St',
      lat: -37.8,
      lon: 144.9,
    })
    expect(db.createPassenger).toHaveBeenCalledWith('u-1', {
      name: 'Alice',
      home_location_id: 'loc-1',
    })
    expect(result).toEqual(mockPassenger)
  })

  it('logs a create audit event with the new passenger id', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: 0, lon: 0 })
    vi.mocked(locationDb.createLocation).mockResolvedValue(mockLocation)
    vi.mocked(db.createPassenger).mockResolvedValue(mockPassenger)

    await create('u-1', { name: 'Alice', homeAddress: 'addr' })

    expect(auditDb.insertAuditLog).toHaveBeenCalledWith('u-1', 'create', 'passenger', 'p-1')
  })
})

describe('update', () => {
  it('updates name without touching the home location when homeUpdate is none', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(db.updatePassenger).mockResolvedValue(mockPassenger)

    const result = await update('p-1', 'u-1', { name: 'Alice', homeUpdate: { type: 'none' } })

    expect(locationDb.updateLocation).not.toHaveBeenCalled()
    expect(locationDb.getLocation).not.toHaveBeenCalled()
    expect(db.updatePassenger).toHaveBeenCalledWith('p-1', 'u-1', {
      name: 'Alice',
      home_location_id: 'loc-1',
    })
    expect(result).toEqual(mockPassenger)
  })

  it('geocodes and updates the existing location when homeUpdate is edit', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.9, lon: 145.0 })
    vi.mocked(locationDb.getLocation).mockResolvedValue(mockLocation)
    vi.mocked(locationDb.updateLocation).mockResolvedValue({ ...mockLocation, address: '999 New St' })
    vi.mocked(db.updatePassenger).mockResolvedValue(mockPassenger)

    await update('p-1', 'u-1', { name: 'Alice', homeUpdate: { type: 'edit', address: '999 New St' } })

    expect(geocode.geocodeAddress).toHaveBeenCalledWith('999 New St')
    expect(locationDb.updateLocation).toHaveBeenCalledWith('loc-1', 'u-1', {
      name: "Alice's home",
      address: '999 New St',
      lat: -37.9,
      lon: 145.0,
    })
    expect(db.updatePassenger).toHaveBeenCalledWith('p-1', 'u-1', expect.objectContaining({ home_location_id: 'loc-1' }))
  })

  it('switches to a different location when homeUpdate is switch', async () => {
    const newLocation = { ...mockLocation, id: 'loc-2', name: 'Hospital', address: '1 Health Ave' }
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(locationDb.getLocation).mockResolvedValue(newLocation)
    vi.mocked(db.updatePassenger).mockResolvedValue({ ...mockPassenger, home_location_id: 'loc-2' })

    await update('p-1', 'u-1', { name: 'Alice', homeUpdate: { type: 'switch', locationId: 'loc-2' } })

    expect(geocode.geocodeAddress).not.toHaveBeenCalled()
    expect(db.updatePassenger).toHaveBeenCalledWith('p-1', 'u-1', expect.objectContaining({ home_location_id: 'loc-2' }))
  })

  it('logs an update audit event', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(db.updatePassenger).mockResolvedValue(mockPassenger)

    await update('p-1', 'u-1', { name: 'Alice', homeUpdate: { type: 'none' } })

    expect(auditDb.insertAuditLog).toHaveBeenCalledWith('u-1', 'update', 'passenger', 'p-1')
  })

  it('throws NotFound when the new location does not belong to user', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(locationDb.getLocation).mockResolvedValue(null)

    await expect(
      update('p-1', 'u-1', { name: 'Alice', homeUpdate: { type: 'switch', locationId: 'bad-loc' } })
    ).rejects.toMatchObject({ errorKey: 'NotFound' })
  })

  it('throws NotFound when passenger does not belong to user', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(null)

    await expect(
      update('p-1', 'other-user', { name: 'X', homeUpdate: { type: 'none' } })
    ).rejects.toMatchObject({ errorKey: 'NotFound' })
  })
})

describe('remove', () => {
  it('deletes the passenger without deleting the location when deleteHomeLocation is false', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(db.deletePassenger).mockResolvedValue(true)

    await remove('p-1', 'u-1', false)

    expect(db.deletePassenger).toHaveBeenCalledWith('p-1', 'u-1')
    expect(locationDb.deleteLocation).not.toHaveBeenCalled()
  })

  it('deletes both the passenger and home location when deleteHomeLocation is true', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(db.deletePassenger).mockResolvedValue(true)
    vi.mocked(locationDb.deleteLocation).mockResolvedValue(true)

    await remove('p-1', 'u-1', true)

    expect(db.deletePassenger).toHaveBeenCalledWith('p-1', 'u-1')
    expect(locationDb.deleteLocation).toHaveBeenCalledWith('loc-1', 'u-1')
  })

  it('logs a delete audit event', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(db.deletePassenger).mockResolvedValue(true)

    await remove('p-1', 'u-1', false)

    expect(auditDb.insertAuditLog).toHaveBeenCalledWith('u-1', 'delete', 'passenger', 'p-1')
  })

  it('throws NotFound when passenger does not exist', async () => {
    vi.mocked(db.getPassenger).mockResolvedValue(null)

    await expect(remove('p-1', 'u-1', false)).rejects.toMatchObject({ errorKey: 'NotFound' })
  })
})

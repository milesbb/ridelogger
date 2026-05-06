import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/locations')
vi.mock('../data/drive_days')
vi.mock('./geocode')

import * as db from '../data/locations'
import * as driveDaysDb from '../data/drive_days'
import * as geocode from './geocode'
import { list, create, update, remove } from './locations'

const mockLocation = {
  id: 'l-1',
  user_id: 'u-1',
  name: 'Hospital',
  address: '1 Health Ave',
  lat: -37.8,
  lon: 144.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

beforeEach(() => { vi.clearAllMocks() })

describe('list', () => {
  it('returns locations from the data layer', async () => {
    vi.mocked(db.listLocations).mockResolvedValue([mockLocation])

    const result = await list('u-1')

    expect(result).toEqual([mockLocation])
    expect(db.listLocations).toHaveBeenCalledWith('u-1')
  })
})

describe('create', () => {
  it('geocodes the address and persists the location', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.8, lon: 144.9 })
    vi.mocked(db.createLocation).mockResolvedValue(mockLocation)

    const result = await create('u-1', { name: 'Hospital', address: '1 Health Ave' })

    expect(geocode.geocodeAddress).toHaveBeenCalledWith('1 Health Ave')
    expect(db.createLocation).toHaveBeenCalledWith('u-1', {
      name: 'Hospital',
      address: '1 Health Ave',
      lat: -37.8,
      lon: 144.9,
    })
    expect(result).toEqual(mockLocation)
  })
})

describe('update', () => {
  it('geocodes the new address and updates the record', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.8, lon: 144.9 })
    vi.mocked(db.updateLocation).mockResolvedValue(mockLocation)

    const result = await update('l-1', 'u-1', { name: 'Hospital', address: '1 Health Ave' })

    expect(result).toEqual(mockLocation)
  })

  it('throws NotFound when location does not belong to user', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: 0, lon: 0 })
    vi.mocked(db.updateLocation).mockResolvedValue(null)

    await expect(update('l-1', 'other-user', { name: 'X', address: 'addr' })).rejects.toMatchObject({
      errorKey: 'NotFound',
    })
  })
})

describe('remove', () => {
  it('deletes the location', async () => {
    vi.mocked(db.isLocationReferenced).mockResolvedValue(false)
    vi.mocked(driveDaysDb.findDriveDaysByLocation).mockResolvedValue([])
    vi.mocked(db.deleteLocation).mockResolvedValue(true)

    await expect(remove('l-1', 'u-1')).resolves.toBeUndefined()
  })

  it('throws NotFound when location does not exist', async () => {
    vi.mocked(db.isLocationReferenced).mockResolvedValue(false)
    vi.mocked(driveDaysDb.findDriveDaysByLocation).mockResolvedValue([])
    vi.mocked(db.deleteLocation).mockResolvedValue(false)

    await expect(remove('l-1', 'u-1')).rejects.toMatchObject({ errorKey: 'NotFound' })
  })

  it('throws Conflict when location is used as a home address', async () => {
    vi.mocked(db.isLocationReferenced).mockResolvedValue(true)
    vi.mocked(driveDaysDb.findDriveDaysByLocation).mockResolvedValue([])

    await expect(remove('l-1', 'u-1')).rejects.toMatchObject({ errorKey: 'Conflict' })
  })

  it('throws Conflict with drive day dates when location is used in legs', async () => {
    vi.mocked(db.isLocationReferenced).mockResolvedValue(false)
    vi.mocked(driveDaysDb.findDriveDaysByLocation).mockResolvedValue([
      { id: 'dd-1', date: '2026-05-06' },
      { id: 'dd-2', date: '2026-05-04' },
    ])

    await expect(remove('l-1', 'u-1')).rejects.toMatchObject({
      errorKey: 'Conflict',
      message: expect.stringContaining('drive day'),
    })
  })
})

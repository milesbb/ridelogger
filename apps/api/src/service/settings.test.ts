import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/settings')
vi.mock('../data/locations')
vi.mock('./geocode')

import * as db from '../data/settings'
import * as locationDb from '../data/locations'
import * as geocode from './geocode'
import { get, upsert } from './settings'

const mockLocation = {
  id: 'loc-1',
  user_id: 'u-1',
  name: 'Home',
  address: '10 Home Rd',
  lat: -37.8,
  lon: 144.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockSettings = {
  id: 's-1',
  user_id: 'u-1',
  home_location_id: 'loc-1',
  home_address: '10 Home Rd',
  home_lat: -37.8,
  home_lon: 144.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

beforeEach(() => { vi.clearAllMocks() })

describe('get', () => {
  it('returns settings when they exist', async () => {
    vi.mocked(db.getSettings).mockResolvedValue(mockSettings)

    const result = await get('u-1')

    expect(result).toEqual(mockSettings)
    expect(db.getSettings).toHaveBeenCalledWith('u-1')
  })

  it('returns null when settings do not exist', async () => {
    vi.mocked(db.getSettings).mockResolvedValue(null)

    const result = await get('u-1')

    expect(result).toBeNull()
  })
})

describe('upsert', () => {
  it('creates a new location and inserts settings on first save', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.8, lon: 144.9 })
    vi.mocked(db.getSettings).mockResolvedValue(null)
    vi.mocked(locationDb.createLocation).mockResolvedValue(mockLocation)
    vi.mocked(db.upsertSettings).mockResolvedValue(mockSettings)

    const result = await upsert('u-1', { homeAddress: '10 Home Rd' })

    expect(locationDb.createLocation).toHaveBeenCalledWith('u-1', {
      name: 'Home',
      address: '10 Home Rd',
      lat: -37.8,
      lon: 144.9,
    })
    expect(db.upsertSettings).toHaveBeenCalledWith('u-1', { home_location_id: 'loc-1' })
    expect(result).toEqual(mockSettings)
  })

  it('updates the existing location in place on subsequent saves', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.9, lon: 145.0 })
    vi.mocked(db.getSettings).mockResolvedValue(mockSettings)
    vi.mocked(locationDb.getLocation).mockResolvedValue(mockLocation)
    vi.mocked(locationDb.updateLocation).mockResolvedValue({ ...mockLocation, address: '20 New Rd' })
    vi.mocked(db.upsertSettings).mockResolvedValue(mockSettings)

    await upsert('u-1', { homeAddress: '20 New Rd' })

    expect(locationDb.createLocation).not.toHaveBeenCalled()
    expect(locationDb.updateLocation).toHaveBeenCalledWith('loc-1', 'u-1', {
      name: 'Home',
      address: '20 New Rd',
      lat: -37.9,
      lon: 145.0,
    })
    expect(db.upsertSettings).toHaveBeenCalledWith('u-1', { home_location_id: 'loc-1' })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/settings')
vi.mock('./geocode')

import * as db from '../data/settings'
import * as geocode from './geocode'
import { get, upsert } from './settings'

const mockSettings = {
  id: 's-1',
  user_id: 'u-1',
  home_address: '10 Home Rd',
  home_lat: -37.8,
  home_lon: 144.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

beforeEach(() => vi.clearAllMocks())

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
  it('geocodes the address and upserts settings', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.8, lon: 144.9 })
    vi.mocked(db.upsertSettings).mockResolvedValue(mockSettings)

    const result = await upsert('u-1', { homeAddress: '10 Home Rd' })

    expect(geocode.geocodeAddress).toHaveBeenCalledWith('10 Home Rd')
    expect(db.upsertSettings).toHaveBeenCalledWith('u-1', {
      home_address: '10 Home Rd',
      home_lat: -37.8,
      home_lon: 144.9,
    })
    expect(result).toEqual(mockSettings)
  })
})

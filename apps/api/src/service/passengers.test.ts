import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/passengers')
vi.mock('./geocode')

import * as db from '../data/passengers'
import * as geocode from './geocode'
import { list, create, update, remove } from './passengers'

const mockPassenger = {
  id: 'p-1',
  user_id: 'u-1',
  name: 'Alice',
  home_address: '123 Main St',
  home_lat: -37.8,
  home_lon: 144.9,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

beforeEach(() => { vi.clearAllMocks() })

describe('list', () => {
  it('returns passengers from the data layer', async () => {
    vi.mocked(db.listPassengers).mockResolvedValue([mockPassenger])

    const result = await list('u-1')

    expect(result).toEqual([mockPassenger])
    expect(db.listPassengers).toHaveBeenCalledWith('u-1')
  })
})

describe('create', () => {
  it('geocodes the address and persists the passenger', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.8, lon: 144.9 })
    vi.mocked(db.createPassenger).mockResolvedValue(mockPassenger)

    const result = await create('u-1', { name: 'Alice', homeAddress: '123 Main St', notes: '' })

    expect(geocode.geocodeAddress).toHaveBeenCalledWith('123 Main St')
    expect(db.createPassenger).toHaveBeenCalledWith('u-1', {
      name: 'Alice',
      home_address: '123 Main St',
      home_lat: -37.8,
      home_lon: 144.9,
      notes: null,
    })
    expect(result).toEqual(mockPassenger)
  })

  it('stores null notes when notes string is empty', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: 0, lon: 0 })
    vi.mocked(db.createPassenger).mockResolvedValue(mockPassenger)

    await create('u-1', { name: 'Alice', homeAddress: 'addr', notes: '' })

    expect(db.createPassenger).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ notes: null }))
  })
})

describe('update', () => {
  it('geocodes the new address and updates the record', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: -37.8, lon: 144.9 })
    vi.mocked(db.updatePassenger).mockResolvedValue(mockPassenger)

    const result = await update('p-1', 'u-1', { name: 'Alice', homeAddress: '123 Main St', notes: 'hi' })

    expect(geocode.geocodeAddress).toHaveBeenCalledWith('123 Main St')
    expect(result).toEqual(mockPassenger)
  })

  it('throws NotFound when passenger does not belong to user', async () => {
    vi.mocked(geocode.geocodeAddress).mockResolvedValue({ lat: 0, lon: 0 })
    vi.mocked(db.updatePassenger).mockResolvedValue(null)

    await expect(update('p-1', 'other-user', { name: 'X', homeAddress: 'addr', notes: '' })).rejects.toMatchObject({
      errorKey: 'NotFound',
    })
  })
})

describe('remove', () => {
  it('deletes the passenger', async () => {
    vi.mocked(db.deletePassenger).mockResolvedValue(true)

    await expect(remove('p-1', 'u-1')).resolves.toBeUndefined()
    expect(db.deletePassenger).toHaveBeenCalledWith('p-1', 'u-1')
  })

  it('throws NotFound when passenger does not exist', async () => {
    vi.mocked(db.deletePassenger).mockResolvedValue(false)

    await expect(remove('p-1', 'u-1')).rejects.toMatchObject({ errorKey: 'NotFound' })
  })
})

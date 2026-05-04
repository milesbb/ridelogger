import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/passengers')
vi.mock('../data/locations')
vi.mock('@ridelogger/routing')

import { getPassenger } from '../data/passengers'
import { getLocation } from '../data/locations'
import { createRoutingService } from '@ridelogger/routing'
import { calculateDriveDay } from './drive'

const mockPassenger = {
  id: 'p-1',
  user_id: 'u-1',
  name: 'Alice',
  home_address: '123 Main St',
  home_lat: -37.8136,
  home_lon: 144.9631,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockLocation = {
  id: 'l-1',
  user_id: 'u-1',
  name: 'Hospital',
  address: '1 Health Ave',
  lat: -37.8749,
  lon: 145.0617,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockGetRoute = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createRoutingService).mockResolvedValue({ getRoute: mockGetRoute, geocode: vi.fn() })
})

describe('calculateDriveDay', () => {
  it('returns route result for a valid segment', async () => {
    vi.mocked(getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(getLocation).mockResolvedValue(mockLocation)
    mockGetRoute.mockResolvedValue({ distanceKm: 12.4, durationMin: 22 })

    const results = await calculateDriveDay('u-1', [{ passengerId: 'p-1', destinationLocationId: 'l-1' }])

    expect(results).toHaveLength(1)
    expect(results[0].passengerName).toBe('Alice')
    expect(results[0].destinationName).toBe('Hospital')
    expect(results[0].distanceKm).toBe(24.8)
    expect(results[0].durationMin).toBe(44)
    expect(results[0].error).toBeUndefined()
  })

  it('returns an error result when passenger not found', async () => {
    vi.mocked(getPassenger).mockResolvedValue(null)

    const results = await calculateDriveDay('u-1', [{ passengerId: 'missing', destinationLocationId: 'l-1' }])

    expect(results[0].error).toBe('Passenger not found')
    expect(results[0].distanceKm).toBe(0)
  })

  it('returns an error result when destination not found', async () => {
    vi.mocked(getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(getLocation).mockResolvedValue(null)

    const results = await calculateDriveDay('u-1', [{ passengerId: 'p-1', destinationLocationId: 'missing' }])

    expect(results[0].error).toBe('Destination not found')
  })

  it('returns an error result when passenger has no coordinates', async () => {
    vi.mocked(getPassenger).mockResolvedValue({ ...mockPassenger, home_lat: null, home_lon: null })
    vi.mocked(getLocation).mockResolvedValue(mockLocation)

    const results = await calculateDriveDay('u-1', [{ passengerId: 'p-1', destinationLocationId: 'l-1' }])

    expect(results[0].error).toMatch(/not geocoded/)
  })

  it('returns an error result when destination has no coordinates', async () => {
    vi.mocked(getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(getLocation).mockResolvedValue({ ...mockLocation, lat: null, lon: null })

    const results = await calculateDriveDay('u-1', [{ passengerId: 'p-1', destinationLocationId: 'l-1' }])

    expect(results[0].error).toMatch(/not geocoded/)
  })

  it('returns an error result when routing throws', async () => {
    vi.mocked(getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(getLocation).mockResolvedValue(mockLocation)
    mockGetRoute.mockRejectedValue(new Error('No route found'))

    const results = await calculateDriveDay('u-1', [{ passengerId: 'p-1', destinationLocationId: 'l-1' }])

    expect(results[0].error).toBe('No route found')
    expect(results[0].distanceKm).toBe(0)
  })

  it('processes multiple segments in parallel', async () => {
    vi.mocked(getPassenger).mockResolvedValue(mockPassenger)
    vi.mocked(getLocation).mockResolvedValue(mockLocation)
    mockGetRoute.mockResolvedValue({ distanceKm: 5, durationMin: 10 })

    const results = await calculateDriveDay('u-1', [
      { passengerId: 'p-1', destinationLocationId: 'l-1' },
      { passengerId: 'p-1', destinationLocationId: 'l-1' },
    ])

    expect(results).toHaveLength(2)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/locations')
vi.mock('@ridelogger/routing')

import { getLocation } from '../data/locations'
import { createRoutingService } from '@ridelogger/routing'
import { calculateDriveDay } from './drive'

const mockHome = {
  id: 'loc-home',
  user_id: 'u-1',
  name: 'Home',
  address: '1 Driver St',
  lat: -37.8,
  lon: 144.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockDestination = {
  id: 'loc-dest',
  user_id: 'u-1',
  name: 'Hospital',
  address: '1 Health Ave',
  lat: -37.87,
  lon: 145.06,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockGetRoute = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createRoutingService).mockResolvedValue({ getRoute: mockGetRoute, geocode: vi.fn() })
})

describe('calculateDriveDay', () => {
  it('returns a result for a valid leg', async () => {
    vi.mocked(getLocation).mockImplementation(async (id) =>
      id === 'loc-home' ? mockHome : mockDestination
    )
    mockGetRoute.mockResolvedValue({ distanceKm: 12.4, durationMin: 22.3 })

    const results = await calculateDriveDay('u-1', [{
      fromLocationId: 'loc-home',
      toLocationId: 'loc-dest',
      label: 'Home → Hospital',
    }])

    expect(results).toHaveLength(1)
    expect(results[0].label).toBe('Home → Hospital')
    expect(results[0].distanceKm).toBe(12.4)
    expect(results[0].durationMin).toBe(22)
    expect(results[0].error).toBeUndefined()
  })

  it('returns an error result when the from location is not found', async () => {
    vi.mocked(getLocation).mockImplementation(async (id) =>
      id === 'loc-dest' ? mockDestination : null
    )

    const results = await calculateDriveDay('u-1', [{
      fromLocationId: 'missing',
      toLocationId: 'loc-dest',
      label: 'Missing → Hospital',
    }])

    expect(results[0].error).toBe('Start location not found')
  })

  it('returns an error result when the to location is not found', async () => {
    vi.mocked(getLocation).mockImplementation(async (id) =>
      id === 'loc-home' ? mockHome : null
    )

    const results = await calculateDriveDay('u-1', [{
      fromLocationId: 'loc-home',
      toLocationId: 'missing',
      label: 'Home → Missing',
    }])

    expect(results[0].error).toBe('End location not found')
  })

  it('returns an error result when a location has no coordinates', async () => {
    vi.mocked(getLocation).mockImplementation(async (id) =>
      id === 'loc-home' ? { ...mockHome, lat: null, lon: null } : mockDestination
    )

    const results = await calculateDriveDay('u-1', [{
      fromLocationId: 'loc-home',
      toLocationId: 'loc-dest',
      label: 'Home → Hospital',
    }])

    expect(results[0].error).toMatch(/not geocoded/)
  })

  it('returns an error result when routing throws', async () => {
    vi.mocked(getLocation).mockImplementation(async (id) =>
      id === 'loc-home' ? mockHome : mockDestination
    )
    mockGetRoute.mockRejectedValue(new Error('No route found'))

    const results = await calculateDriveDay('u-1', [{
      fromLocationId: 'loc-home',
      toLocationId: 'loc-dest',
      label: 'Home → Hospital',
    }])

    expect(results[0].error).toBe('No route found')
    expect(results[0].distanceKm).toBe(0)
  })

  it('processes multiple legs in parallel', async () => {
    vi.mocked(getLocation).mockImplementation(async (id) =>
      id === 'loc-home' ? mockHome : mockDestination
    )
    mockGetRoute.mockResolvedValue({ distanceKm: 5, durationMin: 10 })

    const results = await calculateDriveDay('u-1', [
      { fromLocationId: 'loc-home', toLocationId: 'loc-dest', label: 'Leg 1' },
      { fromLocationId: 'loc-dest', toLocationId: 'loc-home', label: 'Leg 2' },
    ])

    expect(results).toHaveLength(2)
    expect(results[0].label).toBe('Leg 1')
    expect(results[1].label).toBe('Leg 2')
  })
})

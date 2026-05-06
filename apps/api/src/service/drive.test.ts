import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/locations')
vi.mock('../data/drive_days')
vi.mock('@ridelogger/routing')

import { getLocation } from '../data/locations'
import * as driveDaysDb from '../data/drive_days'
import { createRoutingService } from '@ridelogger/routing'
import { calculateDriveDay, saveDriveDay, listDriveDays, getDriveDay, deleteDriveDay } from './drive'

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

const mockDriveDay = {
  id: 'dd-1',
  user_id: 'u-1',
  date: '2026-05-06',
  start_time: '09:00',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockSummary = {
  ...mockDriveDay,
  passenger_names: ['John'],
  total_km: 45.3,
  total_min: 82,
  passenger_km: 12.1,
  passenger_min: 22,
}

const mockLeg = {
  id: 'leg-1',
  drive_day_id: 'dd-1',
  user_id: 'u-1',
  from_location_id: 'loc-home',
  to_location_id: 'loc-dest',
  passenger_id: 'p-1',
  label: 'John: pick-up → drop-off',
  distance_km: 12.1,
  duration_min: 22,
  is_passenger_leg: true,
  position: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const saveLegInput = {
  fromLocationId: 'loc-home',
  toLocationId: 'loc-dest',
  passengerId: 'p-1',
  label: 'John: pick-up → drop-off',
  distanceKm: 12.1,
  durationMin: 22,
  isPassengerLeg: true,
}

describe('saveDriveDay', () => {
  it('creates a drive day and bulk inserts legs', async () => {
    vi.mocked(driveDaysDb.createDriveDay).mockResolvedValue(mockDriveDay)
    vi.mocked(driveDaysDb.createLegs).mockResolvedValue(undefined)

    const result = await saveDriveDay('u-1', {
      date: '2026-05-06',
      startTime: '09:00',
      legs: [saveLegInput],
    })

    expect(result).toEqual({ id: 'dd-1' })
    expect(driveDaysDb.createDriveDay).toHaveBeenCalledWith('u-1', { date: '2026-05-06', startTime: '09:00' })
    expect(driveDaysDb.createLegs).toHaveBeenCalledWith([
      expect.objectContaining({
        drive_day_id: 'dd-1',
        user_id: 'u-1',
        from_location_id: 'loc-home',
        to_location_id: 'loc-dest',
        passenger_id: 'p-1',
        is_passenger_leg: true,
        position: 0,
      }),
    ])
  })
})

describe('listDriveDays', () => {
  it('returns summaries from the data layer', async () => {
    vi.mocked(driveDaysDb.listDriveDays).mockResolvedValue([mockSummary])
    const result = await listDriveDays('u-1')
    expect(result).toEqual([mockSummary])
  })
})

describe('getDriveDay', () => {
  it('returns the detail when found', async () => {
    const detail = { ...mockSummary, legs: [mockLeg] }
    vi.mocked(driveDaysDb.getDriveDayWithLegs).mockResolvedValue(detail)
    const result = await getDriveDay('dd-1', 'u-1')
    expect(result).toEqual(detail)
  })

  it('throws NotFound when drive day does not exist', async () => {
    vi.mocked(driveDaysDb.getDriveDayWithLegs).mockResolvedValue(null)
    await expect(getDriveDay('missing', 'u-1')).rejects.toMatchObject({ httpStatus: 404 })
  })
})

describe('deleteDriveDay', () => {
  it('resolves when the drive day is deleted', async () => {
    vi.mocked(driveDaysDb.deleteDriveDay).mockResolvedValue(true)
    await expect(deleteDriveDay('dd-1', 'u-1')).resolves.toBeUndefined()
  })

  it('throws NotFound when the drive day does not exist', async () => {
    vi.mocked(driveDaysDb.deleteDriveDay).mockResolvedValue(false)
    await expect(deleteDriveDay('missing', 'u-1')).rejects.toMatchObject({ httpStatus: 404 })
  })
})

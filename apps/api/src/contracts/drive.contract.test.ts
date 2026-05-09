import { describe, it, expect, vi, beforeEach } from 'vitest'
import supertest from 'supertest'
import type { Request, Response, NextFunction } from 'express'
import { Errors } from '../utils/errorTypes'

vi.mock('../service/drive')
vi.mock('../middlewares/auth', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    ;(req as { userId?: string }).userId = 'u-1'
    next()
  },
  AuthenticatedRequest: {},
}))
vi.mock('../utils/logging', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import * as svc from '../service/drive'
import app from '../app'

const request = supertest(app)

const mockSummary = {
  id: 'd-1',
  user_id: 'u-1',
  date: '2024-01-15',
  start_time: '09:00',
  passenger_names: ['Alice', 'Bob'],
  total_km: 45.2,
  total_min: 62,
  passenger_km: 30.1,
  passenger_min: 41,
  created_at: '2024-01-15T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z',
}

const LOC_A = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const LOC_B = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'

const mockLeg = {
  id: 'leg-1',
  drive_day_id: 'd-1',
  user_id: 'u-1',
  from_location_id: LOC_A,
  to_location_id: LOC_B,
  passenger_id: null,
  label: 'Home → Office',
  distance_km: 12.4,
  duration_min: 22,
  is_passenger_leg: false,
  position: 0,
  from_location_name: 'Home',
  to_location_name: 'Office',
  created_at: '2024-01-15T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z',
}

function assertSummaryShape(body: Record<string, unknown>): void {
  expect(typeof body.id).toBe('string')
  expect(typeof body.user_id).toBe('string')
  expect(typeof body.date).toBe('string')
  expect(body.start_time === null || typeof body.start_time === 'string').toBe(true)
  expect(Array.isArray(body.passenger_names)).toBe(true)
  expect(typeof body.total_km).toBe('number')
  expect(typeof body.total_min).toBe('number')
  expect(typeof body.passenger_km).toBe('number')
  expect(typeof body.passenger_min).toBe('number')
  expect(typeof body.created_at).toBe('string')
  expect(typeof body.updated_at).toBe('string')
}

function assertLegShape(body: Record<string, unknown>): void {
  expect(typeof body.id).toBe('string')
  expect(typeof body.drive_day_id).toBe('string')
  expect(typeof body.user_id).toBe('string')
  expect(typeof body.from_location_id).toBe('string')
  expect(typeof body.to_location_id).toBe('string')
  expect(body.passenger_id === null || typeof body.passenger_id === 'string').toBe(true)
  expect(typeof body.label).toBe('string')
  expect(typeof body.distance_km).toBe('number')
  expect(typeof body.duration_min).toBe('number')
  expect(typeof body.is_passenger_leg).toBe('boolean')
  expect(typeof body.position).toBe('number')
  expect(body.from_location_name === null || typeof body.from_location_name === 'string').toBe(true)
  expect(body.to_location_name === null || typeof body.to_location_name === 'string').toBe(true)
  expect(typeof body.created_at).toBe('string')
  expect(typeof body.updated_at).toBe('string')
}

beforeEach(() => { vi.clearAllMocks() })

describe('POST /v1/drive/calculate', () => {
  it('returns DriveLegResult[] with required fields on success', async () => {
    vi.mocked(svc.calculateDriveDay).mockResolvedValue([
      { label: 'Leg 1', distanceKm: 12.4, durationMin: 22 },
    ])
    const res = await request.post('/v1/drive/calculate')
      .set('Authorization', 'Bearer test')
      .send({ legs: [{ fromLocationId: LOC_A, toLocationId: LOC_B, label: 'Leg 1' }] })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    const leg = res.body[0]
    expect(typeof leg.label).toBe('string')
    expect(typeof leg.distanceKm).toBe('number')
    expect(typeof leg.durationMin).toBe('number')
  })

  it('returns mixed results — some with error field, some without', async () => {
    vi.mocked(svc.calculateDriveDay).mockResolvedValue([
      { label: 'Leg 1', distanceKm: 12.4, durationMin: 22 },
      { label: 'Leg 2', distanceKm: 0, durationMin: 0, error: 'Start location not found' },
    ])
    const res = await request.post('/v1/drive/calculate')
      .set('Authorization', 'Bearer test')
      .send({ legs: [
        { fromLocationId: LOC_A, toLocationId: LOC_B, label: 'Leg 1' },
        { fromLocationId: LOC_A, toLocationId: LOC_B, label: 'Leg 2' },
      ] })
    expect(res.status).toBe(200)
    expect(res.body[0].error).toBeUndefined()
    expect(typeof res.body[1].error).toBe('string')
  })

  it('returns 400 when legs is not an array', async () => {
    const res = await request.post('/v1/drive/calculate')
      .set('Authorization', 'Bearer test')
      .send({ legs: 'not-an-array' })
    expect(res.status).toBe(400)
    expect(typeof res.body.message).toBe('string')
    expect(typeof res.body.errorKey).toBe('string')
  })
})

describe('POST /v1/drive/save', () => {
  const validLeg = {
    fromLocationId: LOC_A, toLocationId: LOC_B,
    passengerId: null, label: 'Home → Office',
    distanceKm: 12.4, durationMin: 22, isPassengerLeg: false,
  }

  it('returns 201 with { id: string }', async () => {
    vi.mocked(svc.saveDriveDay).mockResolvedValue({ id: 'd-1' })
    const res = await request.post('/v1/drive/save')
      .set('Authorization', 'Bearer test')
      .send({ date: '2024-01-15', startTime: null, legs: [validLeg] })
    expect(res.status).toBe(201)
    expect(typeof res.body.id).toBe('string')
  })

  it('returns 400 when date is missing', async () => {
    const res = await request.post('/v1/drive/save')
      .set('Authorization', 'Bearer test')
      .send({ legs: [validLeg] })
    expect(res.status).toBe(400)
    expect(typeof res.body.errorKey).toBe('string')
  })
})

describe('GET /v1/drive/days', () => {
  it('returns DriveDaySummary[]', async () => {
    vi.mocked(svc.listDriveDays).mockResolvedValue([mockSummary])
    const res = await request.get('/v1/drive/days').set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    assertSummaryShape(res.body[0])
  })
})

describe('GET /v1/drive/days/:id', () => {
  it('returns DriveDayDetail with legs: SavedLeg[]', async () => {
    vi.mocked(svc.getDriveDay).mockResolvedValue({ ...mockSummary, legs: [mockLeg] })
    const res = await request.get('/v1/drive/days/d-1').set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    assertSummaryShape(res.body)
    expect(Array.isArray(res.body.legs)).toBe(true)
    assertLegShape(res.body.legs[0])
  })

  it('errors return { message: string, errorKey: string }', async () => {
    vi.mocked(svc.getDriveDay).mockRejectedValue(Errors.NotFound('Drive day'))
    const res = await request.get('/v1/drive/days/bad-id').set('Authorization', 'Bearer test')
    expect(typeof res.body.message).toBe('string')
    expect(typeof res.body.errorKey).toBe('string')
  })
})

describe('DELETE /v1/drive/days/:id', () => {
  it('returns 204', async () => {
    vi.mocked(svc.deleteDriveDay).mockResolvedValue()
    const res = await request.delete('/v1/drive/days/d-1').set('Authorization', 'Bearer test')
    expect(res.status).toBe(204)
  })
})

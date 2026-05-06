import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'

vi.mock('../service/drive')
vi.mock('../middlewares/auth', () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    ;(req as any).userId = 'user-1'
    next()
  },
  AuthenticatedRequest: {},
}))
vi.mock('../utils/logging', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { calculateDriveDay, saveDriveDay, listDriveDays, getDriveDay, deleteDriveDay } from '../service/drive'
import driveRouter from './drive'
import { errorHandler } from '../middlewares/errorHandler'
import { Errors } from '../utils/errorTypes'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/', driveRouter)
  app.use(errorHandler)
  return app
}

const request = supertest(buildApp())

beforeEach(() => { vi.clearAllMocks() })

const mockSummary = {
  id: 'dd-1',
  user_id: 'user-1',
  date: '2026-05-06',
  start_time: '09:00',
  passenger_names: ['John'],
  total_km: 45.3,
  total_min: 82,
  passenger_km: 12.1,
  passenger_min: 22,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockDetail = {
  ...mockSummary,
  legs: [{
    id: 'leg-1', drive_day_id: 'dd-1', user_id: 'user-1',
    from_location_id: 'loc-a', to_location_id: 'loc-b',
    passenger_id: 'p-1', label: 'John: pick-up → drop-off',
    distance_km: 12.1, duration_min: 22, is_passenger_leg: true,
    position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }],
}

describe('POST /calculate', () => {
  it('returns results for a valid legs array', async () => {
    vi.mocked(calculateDriveDay).mockResolvedValue([{ label: 'Home → Hospital', distanceKm: 5, durationMin: 10 }])
    const res = await request.post('/calculate').send({ legs: [{ fromLocationId: 'a', toLocationId: 'b', label: 'Home → Hospital' }] })
    expect(res.status).toBe(200)
    expect(res.body[0].label).toBe('Home → Hospital')
  })

  it('returns 400 when legs is not an array', async () => {
    const res = await request.post('/calculate').send({ legs: 'bad' })
    expect(res.status).toBe(400)
  })
})

describe('POST /save', () => {
  it('returns 201 with the new drive day id', async () => {
    vi.mocked(saveDriveDay).mockResolvedValue({ id: 'dd-1' })
    const res = await request.post('/save').send({
      date: '2026-05-06',
      startTime: '09:00',
      legs: [{ fromLocationId: 'a', toLocationId: 'b', passengerId: null, label: 'Home → Hospital', distanceKm: 5, durationMin: 10, isPassengerLeg: false }],
    })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('dd-1')
  })

  it('returns 400 when date is missing', async () => {
    const res = await request.post('/save').send({ legs: [] })
    expect(res.status).toBe(400)
  })

  it('returns 400 when legs is not an array', async () => {
    const res = await request.post('/save').send({ date: '2026-05-06', legs: 'bad' })
    expect(res.status).toBe(400)
  })
})

describe('GET /days', () => {
  it('returns summaries', async () => {
    vi.mocked(listDriveDays).mockResolvedValue([mockSummary])
    const res = await request.get('/days')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('dd-1')
  })
})

describe('GET /days/:id', () => {
  it('returns a drive day detail', async () => {
    vi.mocked(getDriveDay).mockResolvedValue(mockDetail)
    const res = await request.get('/days/dd-1')
    expect(res.status).toBe(200)
    expect(res.body.legs).toHaveLength(1)
  })

  it('returns 404 when not found', async () => {
    vi.mocked(getDriveDay).mockRejectedValue(Errors.NotFound('Drive day'))
    const res = await request.get('/days/missing')
    expect(res.status).toBe(404)
  })
})

describe('DELETE /days/:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(deleteDriveDay).mockResolvedValue(undefined)
    const res = await request.delete('/days/dd-1')
    expect(res.status).toBe(204)
  })

  it('returns 404 when not found', async () => {
    vi.mocked(deleteDriveDay).mockRejectedValue(Errors.NotFound('Drive day'))
    const res = await request.delete('/days/missing')
    expect(res.status).toBe(404)
  })
})

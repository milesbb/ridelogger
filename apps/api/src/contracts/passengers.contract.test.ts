import { describe, it, expect, vi, beforeEach } from 'vitest'
import supertest from 'supertest'
import type { Request, Response, NextFunction } from 'express'
import { Errors } from '../utils/errorTypes'

vi.mock('../service/passengers')
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

import * as svc from '../service/passengers'
import app from '../app'

const request = supertest(app)

const mockPassenger = {
  id: 'p-1',
  user_id: 'u-1',
  name: 'Alice',
  home_location_id: 'l-1',
  home_address: '123 Main St',
  home_lat: -37.8136,
  home_lon: 144.9631,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

function assertPassengerShape(body: Record<string, unknown>): void {
  expect(typeof body.id).toBe('string')
  expect(typeof body.user_id).toBe('string')
  expect(typeof body.name).toBe('string')
  expect(typeof body.home_location_id).toBe('string')
  expect(typeof body.home_address).toBe('string')
  expect(body.home_lat === null || typeof body.home_lat === 'number').toBe(true)
  expect(body.home_lon === null || typeof body.home_lon === 'number').toBe(true)
  expect(typeof body.created_at).toBe('string')
  expect(typeof body.updated_at).toBe('string')
}

beforeEach(() => { vi.clearAllMocks() })

describe('GET /v1/passengers', () => {
  it('returns Passenger[]', async () => {
    vi.mocked(svc.list).mockResolvedValue([mockPassenger])
    const res = await request.get('/v1/passengers').set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    assertPassengerShape(res.body[0])
  })
})

describe('POST /v1/passengers', () => {
  it('returns 201 with Passenger shape', async () => {
    vi.mocked(svc.create).mockResolvedValue(mockPassenger)
    const res = await request.post('/v1/passengers')
      .set('Authorization', 'Bearer test')
      .send({ name: 'Alice', homeAddress: '123 Main St' })
    expect(res.status).toBe(201)
    assertPassengerShape(res.body)
  })

  it('errors return { message: string, errorKey: string }', async () => {
    vi.mocked(svc.create).mockRejectedValue(Errors.BadRequest('missing field'))
    const res = await request.post('/v1/passengers')
      .set('Authorization', 'Bearer test')
      .send({})
    expect(typeof res.body.message).toBe('string')
    expect(typeof res.body.errorKey).toBe('string')
  })
})

describe('PUT /v1/passengers/:id', () => {
  it('returns updated Passenger shape', async () => {
    vi.mocked(svc.update).mockResolvedValue(mockPassenger)
    const res = await request.put('/v1/passengers/p-1')
      .set('Authorization', 'Bearer test')
      .send({ name: 'Alice', homeUpdate: { type: 'none' } })
    expect(res.status).toBe(200)
    assertPassengerShape(res.body)
  })
})

describe('DELETE /v1/passengers/:id', () => {
  it('returns 204', async () => {
    vi.mocked(svc.remove).mockResolvedValue()
    const res = await request.delete('/v1/passengers/p-1')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(204)
  })
})

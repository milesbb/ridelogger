import { describe, it, expect, vi, beforeEach } from 'vitest'
import supertest from 'supertest'
import type { Request, Response, NextFunction } from 'express'
import { Errors } from '../utils/errorTypes'

vi.mock('../service/locations')
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

import * as svc from '../service/locations'
import app from '../app'

const request = supertest(app)

const mockLocation = {
  id: 'l-1',
  user_id: 'u-1',
  name: 'Home',
  address: '123 Main St, Melbourne VIC',
  lat: -37.8136,
  lon: 144.9631,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

function assertLocationShape(body: Record<string, unknown>): void {
  expect(typeof body.id).toBe('string')
  expect(typeof body.user_id).toBe('string')
  expect(typeof body.name).toBe('string')
  expect(typeof body.address).toBe('string')
  expect(body.lat === null || typeof body.lat === 'number').toBe(true)
  expect(body.lon === null || typeof body.lon === 'number').toBe(true)
  expect(typeof body.created_at).toBe('string')
  expect(typeof body.updated_at).toBe('string')
}

beforeEach(() => { vi.clearAllMocks() })

describe('GET /v1/locations', () => {
  it('returns Location[]', async () => {
    vi.mocked(svc.list).mockResolvedValue([mockLocation])
    const res = await request.get('/v1/locations').set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    assertLocationShape(res.body[0])
  })
})

describe('POST /v1/locations', () => {
  it('returns 201 with Location shape', async () => {
    vi.mocked(svc.create).mockResolvedValue(mockLocation)
    const res = await request.post('/v1/locations')
      .set('Authorization', 'Bearer test')
      .send({ name: 'Home', address: '123 Main St' })
    expect(res.status).toBe(201)
    assertLocationShape(res.body)
  })

  it('errors return { message: string, errorKey: string }', async () => {
    vi.mocked(svc.create).mockRejectedValue(Errors.BadRequest('missing field'))
    const res = await request.post('/v1/locations')
      .set('Authorization', 'Bearer test')
      .send({})
    expect(typeof res.body.message).toBe('string')
    expect(typeof res.body.errorKey).toBe('string')
  })
})

describe('PUT /v1/locations/:id', () => {
  it('returns updated Location shape', async () => {
    vi.mocked(svc.update).mockResolvedValue(mockLocation)
    const res = await request.put('/v1/locations/l-1')
      .set('Authorization', 'Bearer test')
      .send({ name: 'Home', address: '123 Main St' })
    expect(res.status).toBe(200)
    assertLocationShape(res.body)
  })
})

describe('DELETE /v1/locations/:id', () => {
  it('returns 204', async () => {
    vi.mocked(svc.remove).mockResolvedValue()
    const res = await request.delete('/v1/locations/l-1')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(204)
  })

  it('errors return { message: string, errorKey: string }', async () => {
    vi.mocked(svc.remove).mockRejectedValue(Errors.Conflict('location is in use'))
    const res = await request.delete('/v1/locations/l-1')
      .set('Authorization', 'Bearer test')
    expect(typeof res.body.message).toBe('string')
    expect(typeof res.body.errorKey).toBe('string')
  })
})

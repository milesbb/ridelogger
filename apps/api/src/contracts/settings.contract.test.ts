import { describe, it, expect, vi, beforeEach } from 'vitest'
import supertest from 'supertest'
import type { Request, Response, NextFunction } from 'express'

vi.mock('../service/settings')
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

import * as svc from '../service/settings'
import app from '../app'

const request = supertest(app)

const mockSettings = {
  id: 's-1',
  user_id: 'u-1',
  home_location_id: 'l-1',
  home_address: '123 Main St, Melbourne VIC',
  home_lat: -37.8136,
  home_lon: 144.9631,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

function assertSettingsShape(body: Record<string, unknown>): void {
  expect(typeof body.id).toBe('string')
  expect(typeof body.user_id).toBe('string')
  expect(typeof body.home_location_id).toBe('string')
  expect(typeof body.home_address).toBe('string')
  expect(body.home_lat === null || typeof body.home_lat === 'number').toBe(true)
  expect(body.home_lon === null || typeof body.home_lon === 'number').toBe(true)
  expect(typeof body.created_at).toBe('string')
  expect(typeof body.updated_at).toBe('string')
}

beforeEach(() => { vi.clearAllMocks() })

describe('GET /v1/settings', () => {
  it('returns AppSettings when set', async () => {
    vi.mocked(svc.get).mockResolvedValue(mockSettings)
    const res = await request.get('/v1/settings').set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    assertSettingsShape(res.body)
  })

  it('returns null when not yet configured', async () => {
    vi.mocked(svc.get).mockResolvedValue(null)
    const res = await request.get('/v1/settings').set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })
})

describe('PUT /v1/settings', () => {
  it('returns AppSettings shape', async () => {
    vi.mocked(svc.upsert).mockResolvedValue(mockSettings)
    const res = await request.put('/v1/settings')
      .set('Authorization', 'Bearer test')
      .send({ homeAddress: '123 Main St' })
    expect(res.status).toBe(200)
    assertSettingsShape(res.body)
  })
})

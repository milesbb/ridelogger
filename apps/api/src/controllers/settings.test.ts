import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'

vi.mock('../service/settings')
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

import * as svc from '../service/settings'
import settingsRouter from './settings'
import { errorHandler } from '../middlewares/errorHandler'
import { Errors } from '../utils/errorTypes'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/', settingsRouter)
  app.use(errorHandler)
  return app
}

const request = supertest(buildApp())

beforeEach(() => { vi.clearAllMocks() })

const mockSettings = {
  id: 'set-1',
  user_id: 'user-1',
  home_location_id: 'loc-1',
  home_address: '10 Home St, Suburb VIC 3000',
  home_lat: -37.81,
  home_lon: 144.97,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('GET /', () => {
  it('returns 200 with settings when they exist', async () => {
    vi.mocked(svc.get).mockResolvedValue(mockSettings)
    const res = await request.get('/')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('set-1')
    expect(vi.mocked(svc.get)).toHaveBeenCalledWith('user-1')
  })

  it('returns null when no settings are configured', async () => {
    vi.mocked(svc.get).mockResolvedValue(null)
    const res = await request.get('/')
    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })
})

describe('PUT /', () => {
  it('returns 200 with upserted settings', async () => {
    vi.mocked(svc.upsert).mockResolvedValue(mockSettings)
    const res = await request.put('/').send({ homeAddress: '10 Home St, Suburb VIC 3000' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('set-1')
    expect(vi.mocked(svc.upsert)).toHaveBeenCalledWith('user-1', { homeAddress: '10 Home St, Suburb VIC 3000' })
  })

  it('propagates service errors', async () => {
    vi.mocked(svc.upsert).mockRejectedValue(Errors.BadRequest('Address not found'))
    const res = await request.put('/').send({ homeAddress: 'xyz' })
    expect(res.status).toBe(400)
  })
})

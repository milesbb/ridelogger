import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'

vi.mock('../service/locations')
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

import * as svc from '../service/locations'
import locationsRouter from './locations'
import { errorHandler } from '../middlewares/errorHandler'
import { Errors } from '../utils/errorTypes'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/', locationsRouter)
  app.use(errorHandler)
  return app
}

const request = supertest(buildApp())

beforeEach(() => { vi.clearAllMocks() })

const mockLocation = {
  id: 'loc-1',
  user_id: 'user-1',
  name: 'St Vincent\'s Hospital',
  address: '41 Victoria Parade, Fitzroy VIC 3065',
  lat: -37.8064,
  lon: 144.9793,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('GET /', () => {
  it('returns 200 with a list of locations', async () => {
    vi.mocked(svc.list).mockResolvedValue([mockLocation])
    const res = await request.get('/')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('loc-1')
  })

  it('returns 200 with an empty array when none exist', async () => {
    vi.mocked(svc.list).mockResolvedValue([])
    const res = await request.get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /', () => {
  it('returns 201 with the created location', async () => {
    vi.mocked(svc.create).mockResolvedValue(mockLocation)
    const res = await request.post('/').send({ name: "St Vincent's Hospital", address: '41 Victoria Parade, Fitzroy VIC 3065' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('loc-1')
    expect(vi.mocked(svc.create)).toHaveBeenCalledWith('user-1', {
      name: "St Vincent's Hospital",
      address: '41 Victoria Parade, Fitzroy VIC 3065',
    })
  })

  it('propagates service errors', async () => {
    vi.mocked(svc.create).mockRejectedValue(Errors.BadRequest('Address not found'))
    const res = await request.post('/').send({ name: 'Nowhere', address: 'xyz' })
    expect(res.status).toBe(400)
  })
})

describe('PUT /:id', () => {
  it('returns 200 with the updated location', async () => {
    const updated = { ...mockLocation, name: 'Royal Melbourne Hospital' }
    vi.mocked(svc.update).mockResolvedValue(updated)
    const res = await request.put('/loc-1').send({ name: 'Royal Melbourne Hospital', address: '300 Grattan St' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Royal Melbourne Hospital')
    expect(vi.mocked(svc.update)).toHaveBeenCalledWith('loc-1', 'user-1', {
      name: 'Royal Melbourne Hospital',
      address: '300 Grattan St',
    })
  })

  it('returns 404 when location does not exist', async () => {
    vi.mocked(svc.update).mockRejectedValue(Errors.NotFound('Location'))
    const res = await request.put('/missing').send({ name: 'x', address: 'y' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(svc.remove).mockResolvedValue(undefined)
    const res = await request.delete('/loc-1')
    expect(res.status).toBe(204)
    expect(vi.mocked(svc.remove)).toHaveBeenCalledWith('loc-1', 'user-1')
  })

  it('returns 404 when location does not exist', async () => {
    vi.mocked(svc.remove).mockRejectedValue(Errors.NotFound('Location'))
    const res = await request.delete('/missing')
    expect(res.status).toBe(404)
  })

  it('returns 409 when location is in use', async () => {
    vi.mocked(svc.remove).mockRejectedValue(Errors.Conflict('Location is in use'))
    const res = await request.delete('/loc-in-use')
    expect(res.status).toBe(409)
  })
})

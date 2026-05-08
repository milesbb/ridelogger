import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import supertest from 'supertest'

vi.mock('../service/passengers')
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

import * as svc from '../service/passengers'
import passengersRouter from './passengers'
import { errorHandler } from '../middlewares/errorHandler'
import { Errors } from '../utils/errorTypes'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/', passengersRouter)
  app.use(errorHandler)
  return app
}

const request = supertest(buildApp())

beforeEach(() => { vi.clearAllMocks() })

const mockPassenger = {
  id: 'p-1',
  user_id: 'user-1',
  name: 'Alice Smith',
  home_location_id: 'loc-1',
  home_address: '1 Alice St, Suburb VIC 3000',
  home_lat: -37.81,
  home_lon: 144.97,
  notes: 'Needs wheelchair access',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('GET /', () => {
  it('returns 200 with a list of passengers', async () => {
    vi.mocked(svc.list).mockResolvedValue([mockPassenger])
    const res = await request.get('/')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('p-1')
  })

  it('returns 200 with an empty array when none exist', async () => {
    vi.mocked(svc.list).mockResolvedValue([])
    const res = await request.get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /', () => {
  it('returns 201 with the created passenger', async () => {
    vi.mocked(svc.create).mockResolvedValue(mockPassenger)
    const res = await request.post('/').send({ name: 'Alice Smith', homeAddress: '1 Alice St', notes: 'Needs wheelchair access' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('p-1')
    expect(vi.mocked(svc.create)).toHaveBeenCalledWith('user-1', {
      name: 'Alice Smith',
      homeAddress: '1 Alice St',
      notes: 'Needs wheelchair access',
    })
  })

  it('defaults notes to empty string when omitted', async () => {
    vi.mocked(svc.create).mockResolvedValue(mockPassenger)
    await request.post('/').send({ name: 'Alice', homeAddress: '1 Alice St' })
    expect(vi.mocked(svc.create)).toHaveBeenCalledWith('user-1', {
      name: 'Alice',
      homeAddress: '1 Alice St',
      notes: '',
    })
  })

  it('propagates service errors', async () => {
    vi.mocked(svc.create).mockRejectedValue(Errors.BadRequest('Address not found'))
    const res = await request.post('/').send({ name: 'Alice', homeAddress: 'xyz' })
    expect(res.status).toBe(400)
  })
})

describe('PUT /:id', () => {
  it('returns 200 with the updated passenger', async () => {
    const updated = { ...mockPassenger, name: 'Alice Jones' }
    vi.mocked(svc.update).mockResolvedValue(updated)
    const res = await request.put('/p-1').send({ name: 'Alice Jones', notes: '', homeUpdate: { type: 'none' } })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Alice Jones')
    expect(vi.mocked(svc.update)).toHaveBeenCalledWith('p-1', 'user-1', {
      name: 'Alice Jones',
      notes: '',
      homeUpdate: { type: 'none' },
    })
  })

  it('defaults notes to empty string when omitted', async () => {
    vi.mocked(svc.update).mockResolvedValue(mockPassenger)
    await request.put('/p-1').send({ name: 'Alice', homeUpdate: { type: 'none' } })
    expect(vi.mocked(svc.update)).toHaveBeenCalledWith('p-1', 'user-1', expect.objectContaining({ notes: '' }))
  })

  it('returns 404 when passenger does not exist', async () => {
    vi.mocked(svc.update).mockRejectedValue(Errors.NotFound('Passenger'))
    const res = await request.put('/missing').send({ name: 'x', homeUpdate: { type: 'none' } })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /:id', () => {
  it('returns 204 on success', async () => {
    vi.mocked(svc.remove).mockResolvedValue(undefined)
    const res = await request.delete('/p-1')
    expect(res.status).toBe(204)
    expect(vi.mocked(svc.remove)).toHaveBeenCalledWith('p-1', 'user-1', false)
  })

  it('passes deleteHomeLocation=true from query param', async () => {
    vi.mocked(svc.remove).mockResolvedValue(undefined)
    await request.delete('/p-1?deleteHomeLocation=true')
    expect(vi.mocked(svc.remove)).toHaveBeenCalledWith('p-1', 'user-1', true)
  })

  it('returns 404 when passenger does not exist', async () => {
    vi.mocked(svc.remove).mockRejectedValue(Errors.NotFound('Passenger'))
    const res = await request.delete('/missing')
    expect(res.status).toBe(404)
  })
})

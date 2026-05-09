import { describe, it, expect, vi, beforeEach } from 'vitest'
import supertest from 'supertest'
import type { Request, Response, NextFunction } from 'express'

vi.mock('../service/preferences')
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

import * as svc from '../service/preferences'
import app from '../app'

const request = supertest(app)

const mockPrefs = { drive_log_calendar_default: false }

beforeEach(() => { vi.clearAllMocks() })

describe('GET /v1/preferences', () => {
  it('returns UserPreferences with drive_log_calendar_default', async () => {
    vi.mocked(svc.get).mockResolvedValue(mockPrefs)
    const res = await request.get('/v1/preferences').set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(typeof res.body.drive_log_calendar_default).toBe('boolean')
  })
})

describe('PATCH /v1/preferences', () => {
  it('updates and returns updated preferences', async () => {
    vi.mocked(svc.update).mockResolvedValue({ drive_log_calendar_default: true })
    const res = await request.patch('/v1/preferences')
      .set('Authorization', 'Bearer test')
      .send({ driveLogCalendarDefault: true })
    expect(res.status).toBe(200)
    expect(res.body.drive_log_calendar_default).toBe(true)
  })

  it('returns 400 for invalid body', async () => {
    const res = await request.patch('/v1/preferences')
      .set('Authorization', 'Bearer test')
      .send({ driveLogCalendarDefault: 'not-a-boolean' })
    expect(res.status).toBe(400)
  })
})

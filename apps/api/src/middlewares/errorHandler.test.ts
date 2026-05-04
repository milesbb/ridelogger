import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { errorHandler } from './errorHandler'
import { AppError } from '../utils/errorTypes'

vi.mock('../utils/logging', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import logger from '../utils/logging'

function makeRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res as unknown as Response
}

const mockReq = { method: 'GET', path: '/test' } as Request
const mockNext = vi.fn() as unknown as NextFunction

beforeEach(() => vi.clearAllMocks())

describe('errorHandler', () => {
  it('responds with status and body from an AppError', () => {
    const res = makeRes()
    const err = Object.assign(new Error('Not found'), { httpStatus: 404, errorKey: 'NotFound' }) as AppError

    errorHandler(err, mockReq, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Not found', errorKey: 'NotFound' })
  })

  it('defaults to 500 / Internal for plain errors', () => {
    const res = makeRes()

    errorHandler(new Error('boom'), mockReq, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'boom', errorKey: 'Internal' })
  })

  it('logs 5xx errors', () => {
    const res = makeRes()
    errorHandler(new Error('boom'), mockReq, res, mockNext)

    expect(logger.error).toHaveBeenCalled()
  })

  it('does not log 4xx errors', () => {
    const res = makeRes()
    const err = Object.assign(new Error('bad'), { httpStatus: 400, errorKey: 'BadRequest' }) as AppError

    errorHandler(err, mockReq, res, mockNext)

    expect(logger.error).not.toHaveBeenCalled()
  })
})

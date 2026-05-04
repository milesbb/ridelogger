import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

vi.mock('../service/auth')

import { verifyAccessToken } from '../service/auth'
import { requireAuth, AuthenticatedRequest } from './auth'

function makeReq(authHeader?: string): Request {
  return { headers: authHeader ? { authorization: authHeader } : {} } as Request
}

const mockRes = {} as Response
let mockNext: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockNext = vi.fn()
})

describe('requireAuth', () => {
  it('calls next with Unauthorized when no Authorization header', () => {
    requireAuth(makeReq(), mockRes, mockNext as NextFunction)
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ errorKey: 'Unauthorized' }))
  })

  it('calls next with Unauthorized when header format is wrong', () => {
    requireAuth(makeReq('Basic abc123'), mockRes, mockNext as NextFunction)
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ errorKey: 'Unauthorized' }))
  })

  it('calls next with Unauthorized when only one part in header', () => {
    requireAuth(makeReq('Bearer'), mockRes, mockNext as NextFunction)
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ errorKey: 'Unauthorized' }))
  })

  it('sets userId and calls next() for a valid token', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue({ sub: 'user-1' })
    const req = makeReq('Bearer valid-token')

    requireAuth(req, mockRes, mockNext as NextFunction)
    await vi.waitFor(() => expect(mockNext).toHaveBeenCalled())

    expect((req as AuthenticatedRequest).userId).toBe('user-1')
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('calls next with error when verifyAccessToken throws', async () => {
    const authError = Object.assign(new Error('bad'), { errorKey: 'Unauthorized', httpStatus: 401 })
    vi.mocked(verifyAccessToken).mockRejectedValue(authError)

    requireAuth(makeReq('Bearer bad-token'), mockRes, mockNext as NextFunction)
    await vi.waitFor(() => expect(mockNext).toHaveBeenCalled())

    expect(mockNext).toHaveBeenCalledWith(authError)
  })
})

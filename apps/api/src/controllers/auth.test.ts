import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import supertest from 'supertest'

vi.mock('../service/auth')
vi.mock('../middlewares/auth', () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    ;(req as any).userId = 'user-1'
    next()
  },
  AuthenticatedRequest: {},
}))

import { loginUser, registerUser, refreshUserToken, logoutUser, changePassword, deleteAccount } from '../service/auth'
import authRouter from './auth'
import { errorHandler } from '../middlewares/errorHandler'

vi.mock('../utils/logging', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/', authRouter)
  app.use(errorHandler)
  return app
}

const request = supertest(buildApp())

beforeEach(() => { vi.clearAllMocks() })

describe('POST /login', () => {
  it('returns 200 with accessToken and sets cookies on success', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      accessToken: 'acc-tok',
      refreshToken: 'ref-tok',
      userId: 'user-1',
    })

    const res = await request
      .post('/login')
      .send({ emailOrUsername: 'jo', password: 'secret' })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBe('acc-tok')
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true)
    expect(cookies.some((c: string) => c.startsWith('userId='))).toBe(true)
  })

  it('returns 400 when emailOrUsername is missing', async () => {
    const res = await request.post('/login').send({ password: 'secret' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await request.post('/login').send({ emailOrUsername: 'jo' })
    expect(res.status).toBe(400)
  })

  it('returns 401 for invalid credentials', async () => {
    vi.mocked(loginUser).mockRejectedValue(
      Object.assign(new Error('Invalid email or password'), { httpStatus: 401, errorKey: 'InvalidCredentials' }),
    )

    const res = await request.post('/login').send({ emailOrUsername: 'jo', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body.errorKey).toBe('InvalidCredentials')
  })
})

describe('POST /register', () => {
  it('returns 201 with accessToken on success', async () => {
    vi.mocked(registerUser).mockResolvedValue({
      accessToken: 'acc-tok',
      refreshToken: 'ref-tok',
      userId: 'user-1',
    })

    const res = await request
      .post('/register')
      .send({ email: 'jo@example.com', username: 'jo', password: 'Password1' })

    expect(res.status).toBe(201)
    expect(res.body.accessToken).toBe('acc-tok')
  })

  it('returns 400 when any field is missing', async () => {
    const res = await request.post('/register').send({ email: 'jo@example.com' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is invalid', async () => {
    const res = await request.post('/register').send({ email: 'not-an-email', username: 'jo', password: 'Password1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    const res = await request.post('/register').send({ email: 'jo@example.com', username: 'jo', password: 'abc' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password has no uppercase letter', async () => {
    const res = await request.post('/register').send({ email: 'jo@example.com', username: 'jo', password: 'password1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password has no number', async () => {
    const res = await request.post('/register').send({ email: 'jo@example.com', username: 'jo', password: 'Password' })
    expect(res.status).toBe(400)
  })

  it('returns 409 when email is already registered', async () => {
    vi.mocked(registerUser).mockRejectedValue(
      Object.assign(new Error('An account with those details already exists'), { httpStatus: 409, errorKey: 'Conflict' }),
    )

    const res = await request
      .post('/register')
      .send({ email: 'taken@example.com', username: 'jo', password: 'Password1' })

    expect(res.status).toBe(409)
  })
})

describe('POST /refresh', () => {
  it('returns 200 with new accessToken when cookies are present', async () => {
    vi.mocked(refreshUserToken).mockResolvedValue('new-acc-tok')

    const res = await request
      .post('/refresh')
      .set('Cookie', ['refreshToken=ref-tok; userId=user-1'])

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBe('new-acc-tok')
  })

  it('returns 401 when refresh cookies are missing', async () => {
    const res = await request.post('/refresh')
    expect(res.status).toBe(401)
  })
})

describe('POST /change-password', () => {
  it('returns 204 on success', async () => {
    vi.mocked(changePassword).mockResolvedValue()

    const res = await request
      .post('/change-password')
      .send({ currentPassword: 'old', newPassword: 'NewPass1' })

    expect(res.status).toBe(204)
    expect(changePassword).toHaveBeenCalledWith('user-1', 'old', 'NewPass1')
  })

  it('returns 400 when currentPassword is missing', async () => {
    const res = await request.post('/change-password').send({ newPassword: 'NewPass1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when newPassword is missing', async () => {
    const res = await request.post('/change-password').send({ currentPassword: 'old' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when newPassword does not meet strength requirements', async () => {
    const res = await request.post('/change-password').send({ currentPassword: 'old', newPassword: 'weakpass' })
    expect(res.status).toBe(400)
  })

  it('returns 401 when current password is wrong', async () => {
    vi.mocked(changePassword).mockRejectedValue(
      Object.assign(new Error('Invalid email or password'), { httpStatus: 401, errorKey: 'InvalidCredentials' }),
    )

    const res = await request.post('/change-password').send({ currentPassword: 'wrong', newPassword: 'NewPass1' })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /account', () => {
  it('returns 204 and clears cookies on success', async () => {
    vi.mocked(deleteAccount).mockResolvedValue()

    const res = await request
      .delete('/account')
      .send({ password: 'secret' })

    expect(res.status).toBe(204)
    expect(deleteAccount).toHaveBeenCalledWith('user-1', 'secret')
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c: string) => c.includes('refreshToken=;'))).toBe(true)
  })

  it('returns 400 when password is missing', async () => {
    const res = await request.delete('/account').send({})
    expect(res.status).toBe(400)
  })

  it('returns 401 when password is wrong', async () => {
    vi.mocked(deleteAccount).mockRejectedValue(
      Object.assign(new Error('Invalid email or password'), { httpStatus: 401, errorKey: 'InvalidCredentials' }),
    )

    const res = await request.delete('/account').send({ password: 'wrong' })
    expect(res.status).toBe(401)
  })
})

describe('POST /logout', () => {
  it('returns 204 and clears cookies', async () => {
    vi.mocked(logoutUser).mockResolvedValue()

    const res = await request
      .post('/logout')
      .set('Authorization', 'Bearer acc-tok')

    expect(res.status).toBe(204)
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c: string) => c.includes('refreshToken=;'))).toBe(true)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../data/users')
vi.mock('../data/auth')
vi.mock('bcryptjs')
vi.mock('jsonwebtoken')

import * as userData from '../data/users'
import * as authData from '../data/auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { loginUser, registerUser, logoutUser, refreshUserToken, verifyAccessToken } from './auth'

const mockUser = {
  id: 'user-1',
  email: 'jo@example.com',
  username: 'jo',
  password_hash: 'hashed-pass',
  created_at: new Date().toISOString(),
}

const mockToken = {
  id: 'token-1',
  user_id: 'user-1',
  token_hash: 'hashed-refresh',
  expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  revoked_at: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

describe('loginUser', () => {
  it('returns tokens and userId for valid credentials', async () => {
    vi.mocked(userData.getUserByEmailOrUsername).mockResolvedValue(mockUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-refresh' as never)
    vi.mocked(jwt.sign).mockReturnValue('access-token' as never)
    vi.mocked(authData.storeRefreshToken).mockResolvedValue()

    const result = await loginUser('jo', 'password')

    expect(result.accessToken).toBe('access-token')
    expect(result.userId).toBe('user-1')
    expect(typeof result.refreshToken).toBe('string')
  })

  it('throws InvalidCredentials when user not found', async () => {
    vi.mocked(userData.getUserByEmailOrUsername).mockResolvedValue(null)

    await expect(loginUser('nobody', 'pass')).rejects.toMatchObject({ errorKey: 'InvalidCredentials' })
  })

  it('throws InvalidCredentials when password does not match', async () => {
    vi.mocked(userData.getUserByEmailOrUsername).mockResolvedValue(mockUser)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    await expect(loginUser('jo', 'wrong')).rejects.toMatchObject({ errorKey: 'InvalidCredentials' })
  })

  it('normalises identifier to lowercase before lookup', async () => {
    vi.mocked(userData.getUserByEmailOrUsername).mockResolvedValue(null)

    await expect(loginUser('JO', 'pass')).rejects.toMatchObject({ errorKey: 'InvalidCredentials' })
    expect(userData.getUserByEmailOrUsername).toHaveBeenCalledWith('jo')
  })
})

describe('registerUser', () => {
  it('creates user and returns tokens', async () => {
    vi.mocked(userData.emailExists).mockResolvedValue(false)
    vi.mocked(userData.usernameExists).mockResolvedValue(false)
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-pass' as never)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-refresh' as never)
    vi.mocked(jwt.sign).mockReturnValue('access-token' as never)
    vi.mocked(authData.storeRefreshToken).mockResolvedValue()

    const result = await registerUser('jo@example.com', 'jo', 'password')

    expect(result.accessToken).toBe('access-token')
    expect(result.userId).toBe('user-1')
  })

  it('throws Conflict when email already registered', async () => {
    vi.mocked(userData.emailExists).mockResolvedValue(true)

    await expect(registerUser('taken@example.com', 'jo', 'pass')).rejects.toMatchObject({
      errorKey: 'Conflict',
      message: 'Email already registered',
    })
  })

  it('throws Conflict when username already taken', async () => {
    vi.mocked(userData.emailExists).mockResolvedValue(false)
    vi.mocked(userData.usernameExists).mockResolvedValue(true)

    await expect(registerUser('new@example.com', 'taken', 'pass')).rejects.toMatchObject({
      errorKey: 'Conflict',
      message: 'Username already taken',
    })
  })

  it('normalises email and username to lowercase', async () => {
    vi.mocked(userData.emailExists).mockResolvedValue(false)
    vi.mocked(userData.usernameExists).mockResolvedValue(false)
    vi.mocked(bcrypt.hash).mockResolvedValue('h' as never)
    vi.mocked(userData.createUser).mockResolvedValue(mockUser)
    vi.mocked(jwt.sign).mockReturnValue('tok' as never)
    vi.mocked(authData.storeRefreshToken).mockResolvedValue()

    await registerUser('JO@EXAMPLE.COM', 'JO', 'pass')

    expect(userData.createUser).toHaveBeenCalledWith('jo@example.com', 'jo', expect.any(String))
  })
})

describe('logoutUser', () => {
  it('revokes all tokens for the user', async () => {
    vi.mocked(authData.revokeAllUserTokens).mockResolvedValue()

    await logoutUser('user-1')

    expect(authData.revokeAllUserTokens).toHaveBeenCalledWith('user-1')
  })
})

describe('refreshUserToken', () => {
  it('returns a new access token when a matching token is found', async () => {
    vi.mocked(authData.getActiveRefreshTokens).mockResolvedValue([mockToken])
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(jwt.sign).mockReturnValue('new-access-token' as never)

    const token = await refreshUserToken('raw-refresh', 'user-1')

    expect(token).toBe('new-access-token')
  })

  it('throws Unauthorized when no token matches', async () => {
    vi.mocked(authData.getActiveRefreshTokens).mockResolvedValue([mockToken])
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    await expect(refreshUserToken('wrong-token', 'user-1')).rejects.toMatchObject({ errorKey: 'Unauthorized' })
  })

  it('throws Unauthorized when no active tokens exist', async () => {
    vi.mocked(authData.getActiveRefreshTokens).mockResolvedValue([])

    await expect(refreshUserToken('any', 'user-1')).rejects.toMatchObject({ errorKey: 'Unauthorized' })
  })
})

describe('verifyAccessToken', () => {
  it('returns payload for a valid token', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-1' } as never)

    const payload = await verifyAccessToken('valid-token')

    expect(payload.sub).toBe('user-1')
  })

  it('throws Unauthorized for an invalid token', async () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('invalid') })

    await expect(verifyAccessToken('bad-token')).rejects.toMatchObject({ errorKey: 'Unauthorized' })
  })
})

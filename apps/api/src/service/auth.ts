import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import {
  getUserByEmailOrUsername,
  getUserById,
  createUser,
  emailExists,
  usernameExists,
  updateUserPassword,
  deleteUser,
} from '../data/users'
import { storeRefreshToken, getActiveRefreshTokens, revokeAllUserTokens } from '../data/auth'
import { getJWTSecret } from '../utils/aws/auth'
import { Errors } from '../utils/errorTypes'
import logger from '../utils/logging'

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_DAYS = 30

let cachedJwtSecret: string | null = null

async function getSecret(): Promise<string> {
  if (process.env.NODE_ENV !== 'production') {
    const secret = process.env.JWT_SECRET
    if (!secret) throw Errors.Internal('JWT_SECRET not configured')
    return secret
  }
  if (!cachedJwtSecret) {
    cachedJwtSecret = await getJWTSecret()
  }
  return cachedJwtSecret
}

export async function signAccessToken(userId: string): Promise<string> {
  const secret = await getSecret()
  return jwt.sign({ sub: userId }, secret, { expiresIn: ACCESS_TOKEN_TTL })
}

export async function verifyAccessToken(token: string): Promise<{ sub: string }> {
  const secret = await getSecret()
  try {
    return jwt.verify(token, secret) as { sub: string }
  } catch {
    throw Errors.Unauthorized()
  }
}

async function issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await signAccessToken(userId)
  const rawRefreshToken = crypto.randomBytes(48).toString('hex')
  const tokenHash = await bcrypt.hash(rawRefreshToken, 10)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)
  await storeRefreshToken(userId, tokenHash, expiresAt)
  return { accessToken, refreshToken: rawRefreshToken }
}

export async function loginUser(
  identifier: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const user = await getUserByEmailOrUsername(identifier.toLowerCase())
  if (!user) throw Errors.InvalidCredentials()

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw Errors.InvalidCredentials()

  logger.info('user login', { userId: user.id })
  const tokens = await issueTokens(user.id)
  return { ...tokens, userId: user.id }
}

export async function refreshUserToken(rawToken: string, userId: string): Promise<string> {
  const tokens = await getActiveRefreshTokens(userId)
  for (const t of tokens) {
    const match = await bcrypt.compare(rawToken, t.token_hash)
    if (match) return signAccessToken(userId)
  }
  throw Errors.Unauthorized()
}

export async function logoutUser(userId: string): Promise<void> {
  await revokeAllUserTokens(userId)
  logger.info('user logout', { userId })
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await getUserById(userId)
  if (!user) throw Errors.Unauthorized()

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) throw Errors.InvalidCredentials()

  const newHash = await bcrypt.hash(newPassword, 12)
  await updateUserPassword(userId, newHash)
  await revokeAllUserTokens(userId)
  logger.info('user changed password', { userId })
}

export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await getUserById(userId)
  if (!user) throw Errors.Unauthorized()

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw Errors.InvalidCredentials()

  await deleteUser(userId)
  logger.info('user deleted account', { userId })
}

export async function registerUser(
  email: string,
  username: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const normalisedEmail = email.toLowerCase()
  const normalisedUsername = username.toLowerCase()

  if (await emailExists(normalisedEmail)) throw Errors.Conflict('An account with those details already exists')
  if (await usernameExists(normalisedUsername)) throw Errors.Conflict('An account with those details already exists')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser(normalisedEmail, normalisedUsername, passwordHash)

  logger.info('user registered', { userId: user.id })
  const tokens = await issueTokens(user.id)
  return { ...tokens, userId: user.id }
}

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { getUserByEmail, getUserById, createUser, emailExists } from "../data/users"
import { storeRefreshToken, getActiveRefreshTokens, revokeAllUserTokens } from "../data/auth"
import { Errors } from "../utils/errorTypes"

const ACCESS_TOKEN_TTL = "15m"
const REFRESH_TOKEN_DAYS = 30

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw Errors.Internal("JWT_SECRET not configured")
  return secret
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL })
}

export function verifyAccessToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, getJwtSecret()) as { sub: string }
  } catch {
    throw Errors.Unauthorized()
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await getUserByEmail(email.toLowerCase())
  if (!user) throw Errors.InvalidCredentials()

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw Errors.InvalidCredentials()

  const accessToken = signAccessToken(user.id)
  const rawRefreshToken = crypto.randomBytes(48).toString("hex")
  const tokenHash = await bcrypt.hash(rawRefreshToken, 10)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  await storeRefreshToken(user.id, tokenHash, expiresAt)

  return { accessToken, refreshToken: rawRefreshToken }
}

export async function refreshUserToken(
  rawToken: string,
  userId: string,
): Promise<string> {
  const tokens = await getActiveRefreshTokens(userId)

  for (const t of tokens) {
    const match = await bcrypt.compare(rawToken, t.token_hash)
    if (match) return signAccessToken(userId)
  }

  throw Errors.Unauthorized()
}

export async function logoutUser(userId: string): Promise<void> {
  await revokeAllUserTokens(userId)
}

export async function registerUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const normalised = email.toLowerCase()
  if (await emailExists(normalised)) throw Errors.Conflict("Email already registered")

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser(normalised, passwordHash)

  const accessToken = signAccessToken(user.id)
  const rawRefreshToken = crypto.randomBytes(48).toString("hex")
  const tokenHash = await bcrypt.hash(rawRefreshToken, 10)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  await storeRefreshToken(user.id, tokenHash, expiresAt)

  return { accessToken, refreshToken: rawRefreshToken }
}

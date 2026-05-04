import { query, queryOne } from '../utils/connections'
import { col, optCol } from './utils'

export interface RefreshToken {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  revoked_at: string | null
}

function parseToken(row: Record<string, unknown>): RefreshToken {
  return {
    id: col(row, 'id'),
    user_id: col(row, 'user_id'),
    token_hash: col(row, 'token_hash'),
    expires_at: col(row, 'expires_at'),
    revoked_at: optCol(row, 'revoked_at'),
  }
}

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt],
  )
}

export async function getActiveRefreshTokens(userId: string): Promise<RefreshToken[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, user_id, token_hash, expires_at, revoked_at
     FROM refresh_tokens
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > now()`,
    [userId],
  )
  return rows.map(parseToken)
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId],
  )
}

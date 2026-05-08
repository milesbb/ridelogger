import { query, queryOne } from '../utils/connections'
import { col } from './utils'

export interface User {
  id: string
  email: string
  username: string
  password_hash: string
  created_at: string
}

function parseUser(row: Record<string, unknown>): User {
  return {
    id: col(row, 'id'),
    email: col(row, 'email'),
    username: col(row, 'username'),
    password_hash: col(row, 'password_hash'),
    created_at: col(row, 'created_at'),
  }
}

const USER_COLS = 'id, email, username, password_hash, created_at'

export async function getUserByEmailOrUsername(identifier: string): Promise<User | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT ${USER_COLS} FROM users WHERE email = $1 OR username = $1`,
    [identifier],
  )
  return row ? parseUser(row) : null
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT ${USER_COLS} FROM users WHERE id = $1`,
    [id],
  )
  return row ? parseUser(row) : null
}

export async function createUser(email: string, username: string, passwordHash: string): Promise<User> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING ${USER_COLS}`,
    [email, username, passwordHash],
  )
  return parseUser(rows[0])
}

export async function emailExists(email: string): Promise<boolean> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT 1 FROM users WHERE email = $1',
    [email],
  )
  return row !== null
}

export async function usernameExists(username: string): Promise<boolean> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT 1 FROM users WHERE username = $1',
    [username],
  )
  return row !== null
}

export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<User> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2 RETURNING ${USER_COLS}`,
    [newPasswordHash, userId],
  )
  return parseUser(rows[0])
}

export async function deleteUser(userId: string): Promise<void> {
  await query('DELETE FROM users WHERE id=$1', [userId])
}

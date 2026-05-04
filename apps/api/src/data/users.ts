import { query, queryOne } from "../utils/connections"
import { col, optCol } from "./utils"

export interface User {
  id: string
  email: string
  password_hash: string
  created_at: string
}

function parseUser(row: Record<string, unknown>): User {
  return {
    id: col(row, "id"),
    email: col(row, "email"),
    password_hash: col(row, "password_hash"),
    created_at: col(row, "created_at"),
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const row = await queryOne<Record<string, unknown>>(
    "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
    [email],
  )
  return row ? parseUser(row) : null
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await queryOne<Record<string, unknown>>(
    "SELECT id, email, password_hash, created_at FROM users WHERE id = $1",
    [id],
  )
  return row ? parseUser(row) : null
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const rows = await query<Record<string, unknown>>(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash, created_at",
    [email, passwordHash],
  )
  return parseUser(rows[0])
}

export async function emailExists(email: string): Promise<boolean> {
  const row = await queryOne<Record<string, unknown>>(
    "SELECT 1 FROM users WHERE email = $1",
    [email],
  )
  return row !== null
}

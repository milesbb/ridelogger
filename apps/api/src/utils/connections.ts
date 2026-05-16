import { Pool, PoolClient } from 'pg'
import { supabaseCa } from '../certs/supabase-ca'
import { Errors } from './errorTypes'
import { getDatabaseParameters } from './aws/parameters'
import logger from './logging'

let pool: Pool | null = null

function stripSslMode(uri: string): string {
  try {
    const url = new URL(uri)
    url.searchParams.delete('sslmode')
    return url.toString()
  } catch {
    return uri
  }
}

const DB_CONN_ERROR_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND',
  'SELF_SIGNED_CERT_IN_CHAIN', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
])

function isDbConnectivityError(err: unknown): boolean {
  return err instanceof Error && DB_CONN_ERROR_CODES.has((err as NodeJS.ErrnoException).code ?? '')
}

async function buildPool(): Promise<Pool> {
  let connectionString: string

  if (process.env.NODE_ENV !== 'production') {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
    connectionString = process.env.DATABASE_URL
  } else {
    const params = await getDatabaseParameters()
    connectionString = stripSslMode(params.uri)
  }

  const p = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true, ca: supabaseCa } : false,
  })

  p.on('error', (err) => logger.error('pg pool error', { err }))
  return p
}

async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = await buildPool()
  }
  return pool
}

export async function getConnection(): Promise<PoolClient> {
  try {
    return await (await getPool()).connect()
  } catch (err) {
    if (isDbConnectivityError(err)) {
      logger.error('db connection failed', { err })
      throw Errors.ServiceUnavailable('Database connection failed')
    }
    throw err
  }
}

export async function query<T extends object>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = await getConnection()
  try {
    const result = await client.query(sql, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

export async function queryOne<T extends object>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

import { Pool, PoolClient } from 'pg'
import { getDatabaseParameters } from './aws/parameters'
import logger from './logging'

let pool: Pool | null = null

async function buildPool(): Promise<Pool> {
  let connectionString: string

  if (process.env.NODE_ENV !== 'production') {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
    connectionString = process.env.DATABASE_URL
  } else {
    const params = await getDatabaseParameters()
    connectionString = params.uri
  }

  const p = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? true : false,
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
  return (await getPool()).connect()
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

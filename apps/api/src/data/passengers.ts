import { query, queryOne } from '../utils/connections'
import { col, optCol } from './utils'

export interface Passenger {
  id: string
  user_id: string
  name: string
  home_location_id: string
  home_address: string
  home_lat: number | null
  home_lon: number | null
  created_at: string
  updated_at: string
}

const SELECT = `
  SELECT p.id, p.user_id, p.name, p.home_location_id, p.created_at, p.updated_at,
         l.address AS home_address, l.lat AS home_lat, l.lon AS home_lon
  FROM passengers p
  JOIN locations l ON l.id = p.home_location_id`

function parse(row: Record<string, unknown>): Passenger {
  return {
    id: col(row, 'id'),
    user_id: col(row, 'user_id'),
    name: col(row, 'name'),
    home_location_id: col(row, 'home_location_id'),
    home_address: col(row, 'home_address'),
    home_lat: optCol(row, 'home_lat'),
    home_lon: optCol(row, 'home_lon'),
    created_at: col(row, 'created_at'),
    updated_at: col(row, 'updated_at'),
  }
}

export async function listPassengers(userId: string): Promise<Passenger[]> {
  const rows = await query<Record<string, unknown>>(
    `${SELECT} WHERE p.user_id = $1 ORDER BY p.name`,
    [userId],
  )
  return rows.map(parse)
}

export async function getPassenger(id: string, userId: string): Promise<Passenger | null> {
  const row = await queryOne<Record<string, unknown>>(
    `${SELECT} WHERE p.id = $1 AND p.user_id = $2`,
    [id, userId],
  )
  return row ? parse(row) : null
}

export async function createPassenger(
  userId: string,
  data: { name: string; home_location_id: string },
): Promise<Passenger> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO passengers (user_id, name, home_location_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, data.name, data.home_location_id],
  )
  const created = await queryOne<Record<string, unknown>>(
    `${SELECT} WHERE p.id = $1`,
    [rows[0].id],
  )
  return parse(created!)
}

export async function updatePassenger(
  id: string,
  userId: string,
  data: { name: string; home_location_id: string },
): Promise<Passenger | null> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE passengers
     SET name = $1, home_location_id = $2, updated_at = now()
     WHERE id = $3 AND user_id = $4
     RETURNING id`,
    [data.name, data.home_location_id, id, userId],
  )
  if (!rows[0]) return null
  const updated = await queryOne<Record<string, unknown>>(
    `${SELECT} WHERE p.id = $1`,
    [rows[0].id],
  )
  return parse(updated!)
}

export async function deletePassenger(id: string, userId: string): Promise<boolean> {
  const rows = await query<Record<string, unknown>>(
    'DELETE FROM passengers WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  )
  return rows.length > 0
}

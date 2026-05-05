import { query, queryOne } from '../utils/connections'
import { col, optCol } from './utils'

export interface AppSettings {
  id: string
  user_id: string
  home_location_id: string
  home_address: string
  home_lat: number | null
  home_lon: number | null
  created_at: string
  updated_at: string
}

const SELECT = `
  SELECT s.id, s.user_id, s.home_location_id, s.created_at, s.updated_at,
         l.address AS home_address, l.lat AS home_lat, l.lon AS home_lon
  FROM app_settings s
  JOIN locations l ON l.id = s.home_location_id`

function parse(row: Record<string, unknown>): AppSettings {
  return {
    id: col(row, 'id'),
    user_id: col(row, 'user_id'),
    home_location_id: col(row, 'home_location_id'),
    home_address: col(row, 'home_address'),
    home_lat: optCol(row, 'home_lat'),
    home_lon: optCol(row, 'home_lon'),
    created_at: col(row, 'created_at'),
    updated_at: col(row, 'updated_at'),
  }
}

export async function getSettings(userId: string): Promise<AppSettings | null> {
  const row = await queryOne<Record<string, unknown>>(
    `${SELECT} WHERE s.user_id = $1`,
    [userId],
  )
  return row ? parse(row) : null
}

export async function upsertSettings(
  userId: string,
  data: { home_location_id: string },
): Promise<AppSettings> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO app_settings (user_id, home_location_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE
       SET home_location_id = EXCLUDED.home_location_id,
           updated_at = now()
     RETURNING id`,
    [userId, data.home_location_id],
  )
  const upserted = await queryOne<Record<string, unknown>>(
    `${SELECT} WHERE s.id = $1`,
    [rows[0].id],
  )
  return parse(upserted!)
}

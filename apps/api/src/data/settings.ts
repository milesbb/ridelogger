import { query, queryOne } from "../utils/connections"
import { col, optCol } from "./utils"

export interface AppSettings {
  id: string
  user_id: string
  home_address: string
  home_lat: number | null
  home_lon: number | null
  created_at: string
  updated_at: string
}

function parse(row: Record<string, unknown>): AppSettings {
  return {
    id: col(row, "id"),
    user_id: col(row, "user_id"),
    home_address: col(row, "home_address"),
    home_lat: optCol(row, "home_lat"),
    home_lon: optCol(row, "home_lon"),
    created_at: col(row, "created_at"),
    updated_at: col(row, "updated_at"),
  }
}

export async function getSettings(userId: string): Promise<AppSettings | null> {
  const row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM app_settings WHERE user_id = $1",
    [userId],
  )
  return row ? parse(row) : null
}

export async function upsertSettings(
  userId: string,
  data: { home_address: string; home_lat: number | null; home_lon: number | null },
): Promise<AppSettings> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO app_settings (user_id, home_address, home_lat, home_lon)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET home_address = EXCLUDED.home_address,
           home_lat = EXCLUDED.home_lat,
           home_lon = EXCLUDED.home_lon,
           updated_at = now()
     RETURNING *`,
    [userId, data.home_address, data.home_lat, data.home_lon],
  )
  return parse(rows[0])
}

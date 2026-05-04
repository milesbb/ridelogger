import { query, queryOne } from "../utils/connections"
import { col, optCol } from "./utils"

export interface Location {
  id: string
  user_id: string
  name: string
  address: string
  lat: number | null
  lon: number | null
  created_at: string
  updated_at: string
}

function parse(row: Record<string, unknown>): Location {
  return {
    id: col(row, "id"),
    user_id: col(row, "user_id"),
    name: col(row, "name"),
    address: col(row, "address"),
    lat: optCol(row, "lat"),
    lon: optCol(row, "lon"),
    created_at: col(row, "created_at"),
    updated_at: col(row, "updated_at"),
  }
}

export async function listLocations(userId: string): Promise<Location[]> {
  const rows = await query<Record<string, unknown>>(
    "SELECT * FROM locations WHERE user_id = $1 ORDER BY name",
    [userId],
  )
  return rows.map(parse)
}

export async function getLocation(id: string, userId: string): Promise<Location | null> {
  const row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM locations WHERE id = $1 AND user_id = $2",
    [id, userId],
  )
  return row ? parse(row) : null
}

export async function createLocation(
  userId: string,
  data: { name: string; address: string; lat: number | null; lon: number | null },
): Promise<Location> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO locations (user_id, name, address, lat, lon)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, data.name, data.address, data.lat, data.lon],
  )
  return parse(rows[0])
}

export async function updateLocation(
  id: string,
  userId: string,
  data: { name: string; address: string; lat: number | null; lon: number | null },
): Promise<Location | null> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE locations
     SET name = $1, address = $2, lat = $3, lon = $4, updated_at = now()
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [data.name, data.address, data.lat, data.lon, id, userId],
  )
  return rows[0] ? parse(rows[0]) : null
}

export async function deleteLocation(id: string, userId: string): Promise<boolean> {
  const rows = await query<Record<string, unknown>>(
    "DELETE FROM locations WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId],
  )
  return rows.length > 0
}

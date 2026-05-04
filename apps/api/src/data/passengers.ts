import { query, queryOne } from "../utils/connections"
import { col, optCol } from "./utils"

export interface Passenger {
  id: string
  user_id: string
  name: string
  home_address: string
  home_lat: number | null
  home_lon: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

function parse(row: Record<string, unknown>): Passenger {
  return {
    id: col(row, "id"),
    user_id: col(row, "user_id"),
    name: col(row, "name"),
    home_address: col(row, "home_address"),
    home_lat: optCol(row, "home_lat"),
    home_lon: optCol(row, "home_lon"),
    notes: optCol(row, "notes"),
    created_at: col(row, "created_at"),
    updated_at: col(row, "updated_at"),
  }
}

export async function listPassengers(userId: string): Promise<Passenger[]> {
  const rows = await query<Record<string, unknown>>(
    "SELECT * FROM passengers WHERE user_id = $1 ORDER BY name",
    [userId],
  )
  return rows.map(parse)
}

export async function getPassenger(id: string, userId: string): Promise<Passenger | null> {
  const row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM passengers WHERE id = $1 AND user_id = $2",
    [id, userId],
  )
  return row ? parse(row) : null
}

export async function createPassenger(
  userId: string,
  data: { name: string; home_address: string; home_lat: number | null; home_lon: number | null; notes: string | null },
): Promise<Passenger> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO passengers (user_id, name, home_address, home_lat, home_lon, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, data.name, data.home_address, data.home_lat, data.home_lon, data.notes],
  )
  return parse(rows[0])
}

export async function updatePassenger(
  id: string,
  userId: string,
  data: { name: string; home_address: string; home_lat: number | null; home_lon: number | null; notes: string | null },
): Promise<Passenger | null> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE passengers
     SET name = $1, home_address = $2, home_lat = $3, home_lon = $4, notes = $5, updated_at = now()
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [data.name, data.home_address, data.home_lat, data.home_lon, data.notes, id, userId],
  )
  return rows[0] ? parse(rows[0]) : null
}

export async function deletePassenger(id: string, userId: string): Promise<boolean> {
  const rows = await query<Record<string, unknown>>(
    "DELETE FROM passengers WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId],
  )
  return rows.length > 0
}

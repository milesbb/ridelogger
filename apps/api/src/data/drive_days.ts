import { query, queryOne } from '../utils/connections'
import { col, optCol } from './utils'

export interface DriveDay {
  id: string
  user_id: string
  date: string
  start_time: string | null
  created_at: string
  updated_at: string
}

export interface Leg {
  id: string
  drive_day_id: string
  user_id: string
  from_location_id: string
  to_location_id: string
  passenger_id: string | null
  label: string
  distance_km: number
  duration_min: number
  is_passenger_leg: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface DriveDaySummary extends DriveDay {
  passenger_names: string[]
  total_km: number
  total_min: number
  passenger_km: number
  passenger_min: number
}

export interface DriveDayDetail extends DriveDay {
  passenger_names: string[]
  total_km: number
  total_min: number
  passenger_km: number
  passenger_min: number
  legs: Leg[]
}

export interface LegInsert {
  drive_day_id: string
  user_id: string
  from_location_id: string
  to_location_id: string
  passenger_id: string | null
  label: string
  distance_km: number
  duration_min: number
  is_passenger_leg: boolean
  position: number
}

function parseDay(row: Record<string, unknown>): DriveDay {
  return {
    id: col(row, 'id'),
    user_id: col(row, 'user_id'),
    date: col(row, 'date'),
    start_time: optCol(row, 'start_time'),
    created_at: col(row, 'created_at'),
    updated_at: col(row, 'updated_at'),
  }
}

function parseLeg(row: Record<string, unknown>): Leg {
  return {
    id: col(row, 'id'),
    drive_day_id: col(row, 'drive_day_id'),
    user_id: col(row, 'user_id'),
    from_location_id: col(row, 'from_location_id'),
    to_location_id: col(row, 'to_location_id'),
    passenger_id: optCol(row, 'passenger_id'),
    label: col(row, 'label'),
    distance_km: col(row, 'distance_km'),
    duration_min: col(row, 'duration_min'),
    is_passenger_leg: col(row, 'is_passenger_leg'),
    position: col(row, 'position'),
    created_at: col(row, 'created_at'),
    updated_at: col(row, 'updated_at'),
  }
}

function parseSummary(row: Record<string, unknown>): DriveDaySummary {
  return {
    ...parseDay(row),
    passenger_names: col<string[]>(row, 'passenger_names'),
    total_km: col(row, 'total_km'),
    total_min: col(row, 'total_min'),
    passenger_km: col(row, 'passenger_km'),
    passenger_min: col(row, 'passenger_min'),
  }
}

const SUMMARY_SELECT = `
  SELECT
    dd.id, dd.user_id,
    to_char(dd.date, 'YYYY-MM-DD') AS date,
    to_char(dd.start_time, 'HH24:MI') AS start_time,
    dd.created_at, dd.updated_at,
    COALESCE(
      array_agg(DISTINCT p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL),
      '{}'::text[]
    ) AS passenger_names,
    COALESCE(SUM(l.distance_km), 0) AS total_km,
    COALESCE(SUM(l.duration_min)::int, 0) AS total_min,
    COALESCE(SUM(CASE WHEN l.is_passenger_leg THEN l.distance_km ELSE 0 END), 0) AS passenger_km,
    COALESCE(SUM(CASE WHEN l.is_passenger_leg THEN l.duration_min ELSE 0 END)::int, 0) AS passenger_min
  FROM drive_days dd
  LEFT JOIN legs l ON l.drive_day_id = dd.id
  LEFT JOIN passengers p ON p.id = l.passenger_id`

export async function createDriveDay(
  userId: string,
  data: { date: string; startTime: string | null },
): Promise<DriveDay> {
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO drive_days (user_id, date, start_time)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, to_char(date, 'YYYY-MM-DD') AS date,
       to_char(start_time, 'HH24:MI') AS start_time, created_at, updated_at`,
    [userId, data.date, data.startTime ?? null],
  )
  return parseDay(rows[0])
}

export async function createLegs(legs: LegInsert[]): Promise<void> {
  if (legs.length === 0) return
  const values: unknown[] = []
  const placeholders = legs.map((leg, i) => {
    const b = i * 10
    values.push(
      leg.drive_day_id, leg.user_id, leg.from_location_id, leg.to_location_id,
      leg.passenger_id, leg.label, leg.distance_km, leg.duration_min,
      leg.is_passenger_leg, leg.position,
    )
    return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10})`
  }).join(',')
  await query(
    `INSERT INTO legs
       (drive_day_id,user_id,from_location_id,to_location_id,passenger_id,label,distance_km,duration_min,is_passenger_leg,position)
     VALUES ${placeholders}`,
    values,
  )
}

export async function listDriveDays(userId: string): Promise<DriveDaySummary[]> {
  const rows = await query<Record<string, unknown>>(
    `${SUMMARY_SELECT}
     WHERE dd.user_id = $1
     GROUP BY dd.id, dd.user_id, dd.date, dd.start_time, dd.created_at, dd.updated_at
     ORDER BY dd.date DESC, dd.start_time DESC NULLS LAST`,
    [userId],
  )
  return rows.map(parseSummary)
}

export async function getDriveDayWithLegs(id: string, userId: string): Promise<DriveDayDetail | null> {
  const [summaryRows, legRows] = await Promise.all([
    query<Record<string, unknown>>(
      `${SUMMARY_SELECT}
       WHERE dd.id = $1 AND dd.user_id = $2
       GROUP BY dd.id, dd.user_id, dd.date, dd.start_time, dd.created_at, dd.updated_at`,
      [id, userId],
    ),
    query<Record<string, unknown>>(
      `SELECT * FROM legs WHERE drive_day_id = $1 ORDER BY position`,
      [id],
    ),
  ])
  if (!summaryRows[0]) return null
  return { ...parseSummary(summaryRows[0]), legs: legRows.map(parseLeg) }
}

export async function deleteDriveDay(id: string, userId: string): Promise<boolean> {
  const rows = await query<Record<string, unknown>>(
    'DELETE FROM drive_days WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  )
  return rows.length > 0
}

export async function findDriveDaysByLocation(
  locationId: string,
  userId: string,
): Promise<Array<{ id: string; date: string }>> {
  const rows = await query<Record<string, unknown>>(
    `SELECT DISTINCT dd.id, to_char(dd.date, 'YYYY-MM-DD') AS date
     FROM drive_days dd
     JOIN legs l ON l.drive_day_id = dd.id
     WHERE (l.from_location_id = $1 OR l.to_location_id = $1)
       AND dd.user_id = $2
     ORDER BY dd.date DESC`,
    [locationId, userId],
  )
  return rows.map((r) => ({ id: col<string>(r, 'id'), date: col<string>(r, 'date') }))
}

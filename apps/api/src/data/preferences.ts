import { queryOne } from '../utils/connections'
import { col } from './utils'

export interface UserPreferences {
  drive_log_calendar_default: boolean
}

function parse(row: Record<string, unknown>): UserPreferences {
  return {
    drive_log_calendar_default: col<boolean>(row, 'drive_log_calendar_default'),
  }
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT drive_log_calendar_default FROM users WHERE id = $1`,
    [userId],
  )
  if (!row) throw new Error(`User not found: ${userId}`)
  return parse(row)
}

export async function updatePreferences(
  userId: string,
  data: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const row = await queryOne<Record<string, unknown>>(
    `UPDATE users
     SET drive_log_calendar_default = COALESCE($1, drive_log_calendar_default),
         updated_at = now()
     WHERE id = $2
     RETURNING drive_log_calendar_default`,
    [data.drive_log_calendar_default ?? null, userId],
  )
  if (!row) throw new Error(`User not found: ${userId}`)
  return parse(row)
}

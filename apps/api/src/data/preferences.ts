import { queryOne } from '../utils/connections'
import { col } from './utils'

export interface UserPreferences {
  drive_log_calendar_default: boolean
  theme: 'light' | 'dark'
}

function parse(row: Record<string, unknown>): UserPreferences {
  return {
    drive_log_calendar_default: col<boolean>(row, 'drive_log_calendar_default'),
    theme: col<'light' | 'dark'>(row, 'theme'),
  }
}

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT drive_log_calendar_default, theme FROM users WHERE id = $1`,
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
         theme                      = COALESCE($2, theme),
         updated_at                 = now()
     WHERE id = $3
     RETURNING drive_log_calendar_default, theme`,
    [data.drive_log_calendar_default ?? null, data.theme ?? null, userId],
  )
  if (!row) throw new Error(`User not found: ${userId}`)
  return parse(row)
}

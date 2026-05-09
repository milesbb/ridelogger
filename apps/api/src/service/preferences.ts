import * as db from '../data/preferences'
import type { UserPreferences } from '../data/preferences'

export async function get(userId: string): Promise<UserPreferences> {
  return db.getPreferences(userId)
}

export async function update(
  userId: string,
  data: Partial<UserPreferences>,
): Promise<UserPreferences> {
  return db.updatePreferences(userId, data)
}

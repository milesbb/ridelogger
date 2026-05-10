import { query } from '../utils/connections'

type AuditAction = 'create' | 'update' | 'delete' | 'view'
type EntityType = 'passenger' | 'location'

export async function insertAuditLog(
  userId: string,
  action: AuditAction,
  entityType: EntityType,
  entityId: string | null,
): Promise<void> {
  await query(
    'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
    [userId, action, entityType, entityId],
  )
}

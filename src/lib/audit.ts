const ACTION_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGE: 'password_change',
  TWO_FA_ENABLE: '2fa_enable',
  TWO_FA_DISABLE: '2fa_disable',
  EMAIL_VERIFICATION_ENABLE: 'email_verification_enable',
  EMAIL_VERIFICATION_DISABLE: 'email_verification_disable',
  VAULT_UNLOCK: 'vault_unlock',
  VAULT_LOCK: 'vault_lock',
  ITEM_CREATE: 'item_create',
  ITEM_UPDATE: 'item_update',
  ITEM_DELETE: 'item_delete',
  ITEM_VIEW: 'item_view',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  SETTINGS_UPDATE: 'settings_update',
  EMAIL_UPDATE: 'email_update',
  DATABASE_RESET: 'database_reset',
  BACKUP_CREATE: 'backup_create',
  BACKUP_RESTORE: 'backup_restore',
} as const

type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES]

interface AuditLogParams {
  userId: string
  action: ActionType
  resourceType?: string
  resourceId?: string
  details?: Record<string, unknown>
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export { ACTION_TYPES }
export type { ActionType }

export enum SessionRevokedReason {
  LOGOUT = 'logout',
  REVOKED_BY_USER = 'revoked_by_user',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  ADMIN_ACTION = 'admin_action',
  SUPERADMIN_RESET = 'superadmin_reset',
  IDLE_TIMEOUT = 'idle_timeout',
  MFA_RESET = 'mfa_reset',
}

export type TSessionRevokedReason = `${SessionRevokedReason}`;

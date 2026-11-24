import * as argon2 from 'argon2';

export const ARGON2_OPTIONS = {
  type: argon2.argon2id as 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  raw: false as const,
};

export const AUTH_CACHE_KEYS = {
  SESSION_PREFIX: 'session:',
  SESSION_TOUCH_PREFIX: 'session:touch:',
  AUTH_CONTEXT_PREFIX: 'authctx:',
  MFA_CHALLENGE_PREFIX: 'mfachal:',
  PERMISSION_CATALOG_VERSION: 'rbac:permission_catalog_version',
} as const;

export const AUTH_METADATA_KEYS = {
  IS_PUBLIC: 'isPublic',
  IS_ADMIN_PORTAL: 'isAdminPortal',
  PERMISSIONS: 'permissions',
  ANY_PERMISSIONS: 'anyPermissions',
} as const;

export const AUTH_STRATEGY_NAMES = {
  TENANT: 'jwt-tenant',
  ADMIN: 'jwt-admin',
} as const;

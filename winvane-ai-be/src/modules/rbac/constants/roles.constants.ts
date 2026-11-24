export enum RoleSystemKey {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}

export type TRoleSystemKey = `${RoleSystemKey}`;

export const ROLE_NAMES = {
  SUPER_ADMIN: 'SuperAdmin',
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
} as const;

export type TRoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const PLATFORM_ROLES: readonly TRoleName[] = [
  ROLE_NAMES.SUPER_ADMIN,
] as const;

export const RESERVED_ROLE_NAMES: readonly string[] = [
  'owner',
  'superadmin',
  'super admin',
  'admin',
  'manager',
  'member',
] as const;

export const MAX_CUSTOM_ROLES_PER_WORKSPACE = 20;

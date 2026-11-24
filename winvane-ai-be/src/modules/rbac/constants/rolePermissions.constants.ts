import { ROLE_NAMES, TRoleName } from './roles.constants';
import { PERMISSIONS, TPermissionKey } from './permissions.constants';

export interface IRoleMetadata {
  isPlatformRole: boolean;
  description: string;
}

export const ROLE_METADATA: Record<TRoleName, IRoleMetadata> = {
  [ROLE_NAMES.SUPER_ADMIN]: {
    isPlatformRole: true,
    description: 'Platform Super Administrator with system-wide privileges',
  },
  [ROLE_NAMES.OWNER]: {
    isPlatformRole: false,
    description:
      'Workspace owner with full tenant control and dynamic platform rights',
  },
  [ROLE_NAMES.ADMIN]: {
    isPlatformRole: false,
    description:
      'Workspace administrator with team and resource management rights',
  },
  [ROLE_NAMES.MANAGER]: {
    isPlatformRole: false,
    description: 'Team manager with operational and team oversight rights',
  },
  [ROLE_NAMES.MEMBER]: {
    isPlatformRole: false,
    description: 'Regular workspace team member',
  },
};

export const SUPERADMIN_PERMISSIONS: readonly TPermissionKey[] = [
  PERMISSIONS.SECURITY_SELF,
  PERMISSIONS.ADMIN_ACCESS,
  PERMISSIONS.ADMIN_TENANTS_READ,
  PERMISSIONS.ADMIN_AUDIT_READ,
  PERMISSIONS.ADMIN_STATS_READ,
] as const;

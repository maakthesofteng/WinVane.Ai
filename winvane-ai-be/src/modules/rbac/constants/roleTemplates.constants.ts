import { RoleSystemKey } from './roles.constants';
import { PERMISSIONS, TPermissionKey } from './permissions.constants';

export interface IRoleTemplate {
  name: string;
  systemKey: RoleSystemKey;
  description: string;
  permissions: readonly TPermissionKey[];
}

export const WORKSPACE_ROLE_TEMPLATES: Record<
  RoleSystemKey.ADMIN | RoleSystemKey.MANAGER | RoleSystemKey.MEMBER,
  IRoleTemplate
> = {
  [RoleSystemKey.ADMIN]: {
    name: 'Admin',
    systemKey: RoleSystemKey.ADMIN,
    description:
      'Workspace administrator with team and resource management rights',
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.WORKSPACE_UPDATE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.MEMBERS_INVITE,
      PERMISSIONS.MEMBERS_UPDATE,
      PERMISSIONS.MEMBERS_DEACTIVATE,
      PERMISSIONS.TEAMS_READ,
      PERMISSIONS.TEAMS_CREATE,
      PERMISSIONS.TEAMS_UPDATE,
      PERMISSIONS.TEAMS_DELETE,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.SECURITY_SELF,
    ],
  },
  [RoleSystemKey.MANAGER]: {
    name: 'Manager',
    systemKey: RoleSystemKey.MANAGER,
    description: 'Team manager with operational and team oversight rights',
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.TEAMS_READ,
      PERMISSIONS.TEAMS_CREATE,
      PERMISSIONS.TEAMS_UPDATE,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.SECURITY_SELF,
    ],
  },
  [RoleSystemKey.MEMBER]: {
    name: 'Member',
    systemKey: RoleSystemKey.MEMBER,
    description: 'Standard workspace team member',
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.TEAMS_READ,
      PERMISSIONS.SECURITY_SELF,
    ],
  },
};

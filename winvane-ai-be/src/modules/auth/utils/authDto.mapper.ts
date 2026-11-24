import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { RolePermission } from '../../rbac/entities/rolePermission.entity';
import { Role } from '../../rbac/entities/role.entity';
import { Permission } from '../../rbac/entities/permission.entity';
import {
  RoleSystemKey,
  ROLE_NAMES,
} from '../../rbac/constants/roles.constants';
import {
  IAuthUserDto,
  IWorkspaceSummaryDto,
} from '../interfaces/authResponse.interface';

export function mapUserToAuthUserDto(
  user: User,
  permissions?: string[],
): IAuthUserDto {
  const roleName = (user.role?.name ?? 'Member') as
    'Owner' | 'Admin' | 'Member';

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: roleName,
    isPlatformRole: false,
    workspaceId: user.workspaceId ?? '',
    permissions: permissions ?? [],
    mfaEnabled: user.mfaEnabled,
  };
}

export function mapWorkspaceToSummaryDto(
  workspace: Workspace,
): IWorkspaceSummaryDto {
  return {
    id: workspace.id,
    name: workspace.name,
    domain: workspace.domain,
    status: 'active',
    planTier: workspace.planTier ?? 'free',
  };
}

export async function fetchRolePermissions(
  dataSource: DataSource,
  roleId: string,
): Promise<string[]> {
  const role = await dataSource.getRepository(Role).findOne({
    where: { id: roleId },
  });

  if (
    role &&
    (role.systemKey === RoleSystemKey.OWNER || role.name === ROLE_NAMES.OWNER)
  ) {
    const allTenantPerms = await dataSource.getRepository(Permission).find({
      where: { isPlatform: false },
      select: { key: true },
    });
    return allTenantPerms.map((p) => p.key);
  }
  const rolePermissions = await dataSource.getRepository(RolePermission).find({
    where: { roleId },
    relations: { permission: true },
  });

  return rolePermissions
    .map((rp) => rp.permission?.key)
    .filter((k): k is string => Boolean(k));
}

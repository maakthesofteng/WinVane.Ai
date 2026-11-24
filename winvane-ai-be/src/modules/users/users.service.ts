import { BadRequestException, Injectable } from '@nestjs/common';
import { PLATFORM_ROLES, TRoleName } from '../rbac/constants/roles.constants';

@Injectable()
export class UsersService {
  /**
   * Enforces consistency between role types and workspace scoping:
   * - Platform roles (e.g. SuperAdmin) MUST have workspaceId === null
   * - Tenant roles (Owner, Admin, Member) MUST have a valid non-null workspaceId
   */
  assertRoleWorkspaceConsistency(
    roleName: TRoleName,
    workspaceId: string | null | undefined,
  ): void {
    const isPlatformRole = PLATFORM_ROLES.includes(roleName);

    if (isPlatformRole && workspaceId) {
      throw new BadRequestException(
        `Platform role '${roleName}' must not be assigned to a workspace.`,
      );
    }

    if (!isPlatformRole && (!workspaceId || workspaceId.trim() === '')) {
      throw new BadRequestException(
        `Tenant role '${roleName}' requires a valid workspaceId.`,
      );
    }
  }
}

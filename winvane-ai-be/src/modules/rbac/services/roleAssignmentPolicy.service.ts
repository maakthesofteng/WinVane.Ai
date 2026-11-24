import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { User } from '../../users/entities/user.entity';
import { Role } from '../entities/role.entity';
import { ROLE_NAMES, RoleSystemKey } from '../constants/roles.constants';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class RoleAssignmentPolicyService {
  private isCallerOwner(caller: IAuthContext): boolean {
    return (
      caller.roleSystemKey === RoleSystemKey.OWNER ||
      caller.role === ROLE_NAMES.OWNER
    );
  }

  /**
   * Asserts whether the caller is authorized to assign targetRole to a member.
   * Escalation rule: Target role permissions must be a subset of caller permissions.
   * Owner bypasses the subset check. Owner role itself is never assignable.
   */
  assertCanAssignRole(caller: IAuthContext, targetRole: Role): void {
    if (
      targetRole.workspaceId &&
      targetRole.workspaceId !== caller.workspaceId
    ) {
      throw new ForbiddenException({
        message: 'Role does not belong to this workspace.',
        code: ERROR_CODES.ROLE_NOT_ASSIGNABLE,
      });
    }

    const isOwnerRole =
      targetRole.systemKey === RoleSystemKey.OWNER ||
      targetRole.name === ROLE_NAMES.OWNER;

    if (isOwnerRole) {
      throw new ForbiddenException({
        message: 'The workspace owner role cannot be assigned.',
        code: ERROR_CODES.ROLE_NOT_ASSIGNABLE,
      });
    }

    if (this.isCallerOwner(caller)) {
      return;
    }

    const targetPermissions = this.extractRolePermissionKeys(targetRole);
    const callerPerms = new Set(caller.permissions || []);
    const hasEscalatedPermission = targetPermissions.some(
      (perm) => !callerPerms.has(perm),
    );

    if (hasEscalatedPermission) {
      throw new ForbiddenException({
        message: 'Cannot assign a role with permissions greater than your own.',
        code: ERROR_CODES.ROLE_NOT_ASSIGNABLE,
      });
    }
  }

  /**
   * Asserts whether the caller is authorized to manage the target user.
   * Owner target is immutable.
   * Target's current role permissions must be a subset of caller permissions.
   */
  assertCanManageTarget(caller: IAuthContext, targetUser: User): void {
    const isTargetOwner =
      targetUser.role?.systemKey === RoleSystemKey.OWNER ||
      targetUser.role?.name === ROLE_NAMES.OWNER;

    if (isTargetOwner) {
      throw new ForbiddenException({
        message: 'The workspace owner cannot be modified or deactivated.',
        code: ERROR_CODES.OWNER_IMMUTABLE,
      });
    }

    if (this.isCallerOwner(caller)) {
      return;
    }

    const targetPermissions = targetUser.role
      ? this.extractRolePermissionKeys(targetUser.role)
      : [];

    const callerPerms = new Set(caller.permissions || []);
    const hasUnmanagedPermission = targetPermissions.some(
      (perm) => !callerPerms.has(perm),
    );

    if (hasUnmanagedPermission) {
      throw new ForbiddenException({
        message: 'Cannot manage a user with permissions greater than your own.',
        code: ERROR_CODES.ROLE_NOT_ASSIGNABLE,
      });
    }
  }

  /**
   * Computes whether caller can edit/manage the target role.
   * Owner bypasses all anti-escalation rules.
   * Non-Owners cannot edit their own role (Rule 1).
   * Non-Owners cannot edit a role whose permissions exceed their own (Rule 3).
   */
  canManageRole(caller: IAuthContext, targetRole: Role): boolean {
    if (this.isCallerOwner(caller)) {
      return true;
    }

    if (
      targetRole.systemKey === RoleSystemKey.OWNER ||
      targetRole.name === ROLE_NAMES.OWNER
    ) {
      return false;
    }

    if (this.isCallerOwnRole(caller, targetRole)) {
      return false;
    }

    const targetPerms = this.extractRolePermissionKeys(targetRole);
    const callerPerms = new Set(caller.permissions || []);
    return targetPerms.every((p) => callerPerms.has(p));
  }

  /**
   * Asserts caller can edit the target role; throws HTTP 403 on escalation.
   */
  assertCanEditRole(caller: IAuthContext, targetRole: Role): void {
    if (this.isCallerOwner(caller)) {
      return;
    }

    if (this.isCallerOwnRole(caller, targetRole)) {
      throw new ForbiddenException({
        message: 'You cannot edit the role you currently hold.',
        code: ERROR_CODES.CANNOT_EDIT_OWN_ROLE,
      });
    }

    const targetPerms = this.extractRolePermissionKeys(targetRole);
    const callerPerms = new Set(caller.permissions || []);
    const hasEscalated = targetPerms.some((p) => !callerPerms.has(p));

    if (hasEscalated) {
      throw new ForbiddenException({
        message: 'Cannot manage a role with permissions greater than your own.',
        code: ERROR_CODES.ROLE_NOT_MANAGEABLE,
      });
    }
  }

  /**
   * Asserts all touched keys (added ∪ removed) are held by the non-Owner caller.
   */
  assertCanGrantRevokeKeys(caller: IAuthContext, touchedKeys: string[]): void {
    if (this.isCallerOwner(caller)) {
      return;
    }

    const callerPerms = new Set(caller.permissions || []);
    const offendingKeys = touchedKeys.filter((k) => !callerPerms.has(k));

    if (offendingKeys.length > 0) {
      throw new ForbiddenException({
        message:
          'You can only grant or revoke permissions that you currently hold.',
        code: ERROR_CODES.PERMISSION_NOT_GRANTABLE,
        offendingKeys,
      });
    }
  }

  /**
   * Returns grantable keys for the caller out of all assignable tenant keys.
   */
  getGrantableKeys(
    caller: IAuthContext,
    allAssignableKeys: string[],
  ): string[] {
    if (this.isCallerOwner(caller)) {
      return allAssignableKeys;
    }
    const callerPerms = new Set(caller.permissions || []);
    return allAssignableKeys.filter((k) => callerPerms.has(k));
  }

  canDeleteRole(
    caller: IAuthContext,
    targetRole: Role,
    userCount: number,
  ): boolean {
    if (targetRole.isSystem || userCount > 0) {
      return false;
    }
    return this.canManageRole(caller, targetRole);
  }

  assertNotSelfRoleChange(
    callerUserId: string,
    targetUserId: string,
    roleId?: string,
  ): void {
    if (callerUserId === targetUserId && roleId !== undefined) {
      throw new BadRequestException({
        message: 'You cannot change your own role.',
        code: ERROR_CODES.CANNOT_CHANGE_OWN_ROLE,
      });
    }
  }

  assertNotSelfDeactivate(callerUserId: string, targetUserId: string): void {
    if (callerUserId === targetUserId) {
      throw new BadRequestException({
        message: 'You cannot deactivate yourself.',
        code: ERROR_CODES.CANNOT_DEACTIVATE_SELF,
      });
    }
  }

  private isCallerOwnRole(caller: IAuthContext, targetRole: Role): boolean {
    if (targetRole.name === caller.role) {
      return true;
    }
    if (
      targetRole.systemKey &&
      caller.roleSystemKey &&
      targetRole.systemKey === caller.roleSystemKey
    ) {
      return true;
    }
    return false;
  }

  private extractRolePermissionKeys(role: Role): string[] {
    return (role.rolePermissions || [])
      .map((rp) => rp.permission?.key)
      .filter((k): k is string => Boolean(k));
  }
}

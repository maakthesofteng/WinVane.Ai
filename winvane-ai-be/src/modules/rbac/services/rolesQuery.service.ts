import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { ROLE_NAMES, RoleSystemKey } from '../constants/roles.constants';
import { RoleAssignmentPolicyService } from './roleAssignmentPolicy.service';
import { IRoleSummary } from '../interfaces/roles.interface';

const SYSTEM_ROLE_ORDER: Record<string, number> = {
  [RoleSystemKey.ADMIN]: 1,
  [RoleSystemKey.MANAGER]: 2,
  [RoleSystemKey.MEMBER]: 3,
};

@Injectable()
export class RolesQueryService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleAssignmentPolicy: RoleAssignmentPolicyService,
  ) {}

  async listRoles(
    workspaceId: string,
    caller: IAuthContext,
  ): Promise<IRoleSummary[]> {
    const roles = await this.roleRepository.find({
      where: {
        workspaceId,
        isPlatformRole: false,
      },
      relations: {
        rolePermissions: {
          permission: true,
        },
      },
    });

    const nonOwnerRoles = roles.filter(
      (r) =>
        r.systemKey !== RoleSystemKey.OWNER &&
        r.name !== ROLE_NAMES.OWNER &&
        r.name !== ROLE_NAMES.SUPER_ADMIN,
    );

    const userCounts = await this.getUserCountsByRole(workspaceId);

    // Sort: Admin, Manager, Member, then custom roles by name
    nonOwnerRoles.sort((a, b) => {
      const aOrder = a.systemKey ? SYSTEM_ROLE_ORDER[a.systemKey] || 99 : 99;
      const bOrder = b.systemKey ? SYSTEM_ROLE_ORDER[b.systemKey] || 99 : 99;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return nonOwnerRoles.map((role) =>
      this.toRoleSummary(role, caller, userCounts.get(role.id) || 0),
    );
  }

  async getRoleById(
    workspaceId: string,
    roleId: string,
    caller: IAuthContext,
  ): Promise<IRoleSummary> {
    const role = await this.roleRepository.findOne({
      where: {
        id: roleId,
        workspaceId,
        isPlatformRole: false,
      },
      relations: {
        rolePermissions: {
          permission: true,
        },
      },
    });

    if (
      !role ||
      role.systemKey === RoleSystemKey.OWNER ||
      role.name === ROLE_NAMES.OWNER ||
      role.name === ROLE_NAMES.SUPER_ADMIN
    ) {
      throw new NotFoundException('Role not found.');
    }

    const userCount = await this.userRepository.count({
      where: { roleId, workspaceId },
    });

    return this.toRoleSummary(role, caller, userCount);
  }

  toRoleSummary(
    role: Role,
    caller: IAuthContext,
    userCount: number,
  ): IRoleSummary {
    const permissionKeys = (role.rolePermissions || [])
      .filter(
        (rp) =>
          rp.permission &&
          rp.permission.isAssignable &&
          !rp.permission.isPlatform,
      )
      .map((rp) => rp.permission.key)
      .sort();

    const canEdit = this.roleAssignmentPolicy.canManageRole(caller, role);
    const canDelete = this.roleAssignmentPolicy.canDeleteRole(
      caller,
      role,
      userCount,
    );

    let teamSlot: 'admin' | 'manager' | 'member' = 'member';
    if (role.systemKey === RoleSystemKey.ADMIN) {
      teamSlot = 'admin';
    } else if (role.systemKey === RoleSystemKey.MANAGER) {
      teamSlot = 'manager';
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description || null,
      systemKey: (role.systemKey as 'admin' | 'manager' | 'member') || null,
      isSystem: Boolean(role.isSystem),
      userCount,
      permissionKeys,
      canEdit,
      canDelete,
      teamSlot,
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  private async getUserCountsByRole(
    workspaceId: string,
  ): Promise<Map<string, number>> {
    const rawCounts: Array<{ roleId: string; count: string }> =
      await this.userRepository
        .createQueryBuilder('user')
        .select('user.role_id', 'roleId')
        .addSelect('COUNT(user.id)', 'count')
        .where('user.workspace_id = :workspaceId', { workspaceId })
        .groupBy('user.role_id')
        .getRawMany();

    const map = new Map<string, number>();
    for (const r of rawCounts) {
      if (r.roleId) {
        map.set(r.roleId, parseInt(r.count, 10));
      }
    }
    return map;
  }
}

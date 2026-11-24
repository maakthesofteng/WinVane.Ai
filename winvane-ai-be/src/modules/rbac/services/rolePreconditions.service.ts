import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import {
  MAX_CUSTOM_ROLES_PER_WORKSPACE,
  RESERVED_ROLE_NAMES,
  ROLE_NAMES,
  RoleSystemKey,
} from '../constants/roles.constants';

@Injectable()
export class RolePreconditionsService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  assertNotReservedName(name: string): void {
    if (RESERVED_ROLE_NAMES.includes(name.trim().toLowerCase())) {
      throw new ConflictException({
        message: 'Role name is reserved.',
        code: ERROR_CODES.ROLE_NAME_TAKEN,
      });
    }
  }

  async assertNameUnique(
    workspaceId: string,
    name: string,
    excludeRoleId?: string,
  ): Promise<string> {
    const cleanName = name.trim();
    this.assertNotReservedName(cleanName);

    let qb = this.roleRepository
      .createQueryBuilder('role')
      .where('role.workspace_id = :workspaceId', { workspaceId })
      .andWhere('LOWER(role.name) = LOWER(:name)', { name: cleanName });

    if (excludeRoleId) {
      qb = qb.andWhere('role.id != :id', { id: excludeRoleId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException({
        message: 'A role with this name already exists in this workspace.',
        code: ERROR_CODES.ROLE_NAME_TAKEN,
      });
    }

    return cleanName;
  }

  async assertCustomRolesLimitNotExceeded(workspaceId: string): Promise<void> {
    const count = await this.roleRepository.count({
      where: { workspaceId, isSystem: false },
    });

    if (count >= MAX_CUSTOM_ROLES_PER_WORKSPACE) {
      throw new ConflictException({
        message: 'Maximum limit of 20 custom roles reached for this workspace.',
        code: ERROR_CODES.ROLE_LIMIT_REACHED,
      });
    }
  }

  async loadTargetRole(workspaceId: string, roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, workspaceId, isPlatformRole: false },
      relations: { rolePermissions: { permission: true } },
    });

    if (
      !role ||
      role.systemKey === RoleSystemKey.OWNER ||
      role.name === ROLE_NAMES.OWNER ||
      role.name === ROLE_NAMES.SUPER_ADMIN
    ) {
      throw new NotFoundException('Role not found.');
    }

    return role;
  }

  async resolveCopyTemplatePermissions(
    workspaceId: string,
    templateRoleId: string,
  ): Promise<string[]> {
    const sourceRole = await this.roleRepository.findOne({
      where: { id: templateRoleId, workspaceId, isPlatformRole: false },
      relations: { rolePermissions: { permission: true } },
    });

    if (
      !sourceRole ||
      sourceRole.systemKey === RoleSystemKey.OWNER ||
      sourceRole.name === ROLE_NAMES.OWNER
    ) {
      throw new BadRequestException({
        message: 'Invalid copyFromRoleId.',
        code: ERROR_CODES.ROLE_NOT_ASSIGNABLE,
      });
    }

    return (sourceRole.rolePermissions || [])
      .filter(
        (rp) =>
          rp.permission &&
          rp.permission.isAssignable &&
          !rp.permission.isPlatform,
      )
      .map((rp) => rp.permission.key);
  }
}

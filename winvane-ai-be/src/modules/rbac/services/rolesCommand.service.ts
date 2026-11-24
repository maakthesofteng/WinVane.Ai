import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/rolePermission.entity';
import { User } from '../../users/entities/user.entity';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { AuthContextService } from '../../auth-core/services/authContext.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { RoleSystemKey } from '../constants/roles.constants';
import { PERMISSIONS } from '../constants/permissions.constants';
import { RoleAssignmentPolicyService } from './roleAssignmentPolicy.service';
import { RolePreconditionsService } from './rolePreconditions.service';
import { RolesQueryService } from './rolesQuery.service';
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto } from '../dto';
import { ICreateRoleResult, IRoleSummary } from '../interfaces/roles.interface';

@Injectable()
export class RolesCommandService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roleAssignmentPolicy: RoleAssignmentPolicyService,
    private readonly rolePreconditions: RolePreconditionsService,
    private readonly rolesQueryService: RolesQueryService,
    private readonly authContextService: AuthContextService,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    workspaceId: string,
    caller: IAuthContext,
    dto: CreateRoleDto,
  ): Promise<ICreateRoleResult> {
    const cleanName = await this.rolePreconditions.assertNameUnique(
      workspaceId,
      dto.name,
    );
    await this.rolePreconditions.assertCustomRolesLimitNotExceeded(workspaceId);

    let keysToGrant: string[] = [];
    let droppedKeys: string[] | undefined;

    if (dto.copyFromRoleId) {
      const sourceKeys =
        await this.rolePreconditions.resolveCopyTemplatePermissions(
          workspaceId,
          dto.copyFromRoleId,
        );

      if (caller.roleSystemKey === RoleSystemKey.OWNER) {
        keysToGrant = sourceKeys;
      } else {
        const callerPerms = new Set(caller.permissions || []);
        keysToGrant = sourceKeys.filter((k) => callerPerms.has(k));
        const dropped = sourceKeys.filter((k) => !callerPerms.has(k));
        if (dropped.length > 0) {
          droppedKeys = dropped;
        }
      }
    }

    const createdRole = await this.dataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const rpRepo = manager.getRepository(RolePermission);

      const role = roleRepo.create({
        workspaceId,
        name: cleanName,
        description: dto.description?.trim() || '',
        systemKey: null,
        isSystem: false,
        isPlatformRole: false,
        createdById: caller.userId,
      });

      const saved = await roleRepo.save(role);

      const allKeysToAttach = Array.from(
        new Set([PERMISSIONS.SECURITY_SELF, ...keysToGrant]),
      );

      const perms = await manager.getRepository(Permission).find({
        where: { key: In(allKeysToAttach) },
      });

      const rpEntities = perms.map((p) =>
        rpRepo.create({
          roleId: saved.id,
          permissionId: p.id,
        }),
      );

      if (rpEntities.length > 0) {
        await rpRepo.save(rpEntities);
      }

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.ROLE_CREATED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'role',
          targetId: saved.id,
          metadata: {
            name: saved.name,
            initialPermissionsCount: rpEntities.length,
          },
        },
        manager,
      );

      return saved;
    });

    const summary = await this.rolesQueryService.getRoleById(
      workspaceId,
      createdRole.id,
      caller,
    );

    return {
      ...summary,
      droppedKeys,
    };
  }

  async update(
    workspaceId: string,
    roleId: string,
    caller: IAuthContext,
    dto: UpdateRoleDto,
  ): Promise<IRoleSummary> {
    const role = await this.rolePreconditions.loadTargetRole(
      workspaceId,
      roleId,
    );
    this.roleAssignmentPolicy.assertCanEditRole(caller, role);

    if (dto.name !== undefined) {
      const cleanName = dto.name.trim();
      if (
        role.isSystem &&
        cleanName.toLowerCase() !== role.name.toLowerCase()
      ) {
        throw new BadRequestException({
          message: 'System role names cannot be changed.',
          code: ERROR_CODES.SYSTEM_ROLE_NAME_IMMUTABLE,
        });
      }

      if (
        !role.isSystem &&
        cleanName.toLowerCase() !== role.name.toLowerCase()
      ) {
        await this.rolePreconditions.assertNameUnique(
          workspaceId,
          cleanName,
          role.id,
        );
        role.name = cleanName;
      }
    }

    if (dto.description !== undefined) {
      role.description = dto.description.trim();
    }

    await this.roleRepository.save(role);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ROLE_UPDATED,
      result: AuditResult.SUCCESS,
      actorUserId: caller.userId,
      workspaceId,
      targetType: 'role',
      targetId: role.id,
      metadata: { name: role.name, description: role.description },
    });

    return this.rolesQueryService.getRoleById(workspaceId, role.id, caller);
  }

  async updatePermissions(
    workspaceId: string,
    roleId: string,
    caller: IAuthContext,
    dto: UpdateRolePermissionsDto,
  ): Promise<IRoleSummary> {
    const role = await this.rolePreconditions.loadTargetRole(
      workspaceId,
      roleId,
    );
    this.roleAssignmentPolicy.assertCanEditRole(caller, role);

    const assignablePerms = await this.permissionRepository.find({
      where: { isPlatform: false, isAssignable: true },
    });
    const assignableMap = new Map(assignablePerms.map((p) => [p.key, p]));

    const invalidKeys = dto.permissionKeys.filter((k) => !assignableMap.has(k));
    if (invalidKeys.length > 0) {
      throw new BadRequestException({
        message: 'One or more permission keys are invalid or not assignable.',
        code: ERROR_CODES.PERMISSION_INVALID,
        invalidKeys,
      });
    }

    const currentKeys = (role.rolePermissions || [])
      .filter(
        (rp) =>
          rp.permission &&
          rp.permission.isAssignable &&
          !rp.permission.isPlatform,
      )
      .map((rp) => rp.permission.key);

    const added = dto.permissionKeys.filter((k) => !currentKeys.includes(k));
    const removed = currentKeys.filter((k) => !dto.permissionKeys.includes(k));
    const touched = Array.from(new Set([...added, ...removed]));

    this.roleAssignmentPolicy.assertCanGrantRevokeKeys(caller, touched);

    const securitySelfPerm = await this.permissionRepository.findOne({
      where: { key: PERMISSIONS.SECURITY_SELF },
    });

    await this.dataSource.transaction(async (manager) => {
      const rpRepo = manager.getRepository(RolePermission);
      await rpRepo.delete({ roleId: role.id });

      const permissionsToAttach = dto.permissionKeys
        .map((k) => assignableMap.get(k))
        .filter((p): p is Permission => Boolean(p));

      if (securitySelfPerm) {
        permissionsToAttach.push(securitySelfPerm);
      }

      const rpEntities = permissionsToAttach.map((p) =>
        rpRepo.create({
          roleId: role.id,
          permissionId: p.id,
        }),
      );

      if (rpEntities.length > 0) {
        await rpRepo.save(rpEntities);
      }

      role.updatedAt = new Date();
      await manager.getRepository(Role).save(role);

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.ROLE_PERMISSIONS_UPDATED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'role',
          targetId: role.id,
          metadata: { roleName: role.name, added, removed },
        },
        manager,
      );
    });

    await this.authContextService.invalidateByRole(role.id);

    return this.rolesQueryService.getRoleById(workspaceId, role.id, caller);
  }

  async delete(
    workspaceId: string,
    roleId: string,
    caller: IAuthContext,
  ): Promise<void> {
    const role = await this.rolePreconditions.loadTargetRole(
      workspaceId,
      roleId,
    );

    if (role.isSystem) {
      throw new BadRequestException({
        message: 'System roles cannot be deleted.',
        code: ERROR_CODES.SYSTEM_ROLE_NOT_DELETABLE,
      });
    }

    this.roleAssignmentPolicy.assertCanEditRole(caller, role);

    const userCount = await this.userRepository.count({
      where: { roleId: role.id, workspaceId },
    });

    if (userCount > 0) {
      throw new ConflictException({
        message: `Cannot delete role because it is currently assigned to ${userCount} user(s).`,
        code: ERROR_CODES.ROLE_IN_USE,
        userCount,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(RolePermission).delete({ roleId: role.id });
      await manager.getRepository(Role).delete({ id: role.id, workspaceId });

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.ROLE_DELETED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'role',
          targetId: role.id,
          metadata: { roleName: role.name },
        },
        manager,
      );
    });
  }
}

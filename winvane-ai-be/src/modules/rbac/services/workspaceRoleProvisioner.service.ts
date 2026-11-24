import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/rolePermission.entity';
import { RoleSystemKey } from '../constants/roles.constants';
import { WORKSPACE_ROLE_TEMPLATES } from '../constants/roleTemplates.constants';

@Injectable()
export class WorkspaceRoleProvisioner {
  private readonly logger = new Logger(WorkspaceRoleProvisioner.name);

  constructor(private readonly dataSource: DataSource) {}

  async provision(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<Role[]> {
    const em = manager ?? this.dataSource.manager;
    const roleRepo = em.getRepository(Role);
    const permRepo = em.getRepository(Permission);
    const rolePermRepo = em.getRepository(RolePermission);

    // Fetch existing system roles for this workspace to ensure idempotency
    const existingRoles = await roleRepo.find({
      where: {
        workspaceId,
        systemKey: In([
          RoleSystemKey.ADMIN,
          RoleSystemKey.MANAGER,
          RoleSystemKey.MEMBER,
        ]),
      },
    });

    const existingKeys = new Set(
      existingRoles
        .map((r) => r.systemKey)
        .filter((k): k is RoleSystemKey => Boolean(k)),
    );

    // Preload permissions for all templates
    const allTemplatePermKeys = Array.from(
      new Set(
        Object.values(WORKSPACE_ROLE_TEMPLATES).flatMap(
          (template) => template.permissions,
        ),
      ),
    );

    const permissions = await permRepo.find({
      where: { key: In(allTemplatePermKeys) },
    });
    const permMap = new Map(permissions.map((p) => [p.key, p]));

    const provisionedRoles: Role[] = [...existingRoles];

    for (const template of Object.values(WORKSPACE_ROLE_TEMPLATES)) {
      if (existingKeys.has(template.systemKey)) {
        continue;
      }

      const role = roleRepo.create({
        name: template.name,
        systemKey: template.systemKey,
        isSystem: true,
        isPlatformRole: false,
        workspaceId,
        description: template.description,
      });

      const savedRole = await roleRepo.save(role);

      const rolePermsToInsert: RolePermission[] = [];
      for (const pKey of template.permissions) {
        const perm = permMap.get(pKey);
        if (perm) {
          rolePermsToInsert.push(
            rolePermRepo.create({
              roleId: savedRole.id,
              permissionId: perm.id,
            }),
          );
        } else {
          this.logger.warn(
            `Template permission key not found in catalog: ${pKey}`,
          );
        }
      }

      if (rolePermsToInsert.length > 0) {
        await rolePermRepo.save(rolePermsToInsert);
      }

      provisionedRoles.push(savedRole);
    }

    return provisionedRoles;
  }
}

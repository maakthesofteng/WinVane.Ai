import { IsNull } from 'typeorm';
import Redis from 'ioredis';
import appDataSource from '../dataSource';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Permission } from '../../modules/rbac/entities/permission.entity';
import { RolePermission } from '../../modules/rbac/entities/rolePermission.entity';
import { Workspace } from '../../modules/workspace/entities/workspace.entity';
import {
  PERMISSION_CATALOG,
  ROLE_METADATA,
  ROLE_NAMES,
  RoleSystemKey,
  SUPERADMIN_PERMISSIONS,
  TPermissionKey,
  WORKSPACE_ROLE_TEMPLATES,
} from '../../modules/rbac/constants';
import { WorkspaceRoleProvisioner } from '../../modules/rbac/services/workspaceRoleProvisioner.service';
import { AUTH_CACHE_KEYS } from '../../modules/auth-core/constants/auth.constants';

export async function seedRoles(): Promise<void> {
  const initialized = appDataSource.isInitialized;
  if (!initialized) {
    await appDataSource.initialize();
  }

  try {
    await appDataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const permRepo = manager.getRepository(Permission);
      const rolePermRepo = manager.getRepository(RolePermission);
      const workspaceRepo = manager.getRepository(Workspace);

      // 1. Reconcile Global Roles (SuperAdmin and Owner)
      const globalRoleMap = new Map<string, Role>();

      const globalRolesConfig = [
        {
          name: ROLE_NAMES.SUPER_ADMIN,
          systemKey: RoleSystemKey.SUPER_ADMIN,
          isSystem: true,
          isPlatformRole: true,
          description: ROLE_METADATA[ROLE_NAMES.SUPER_ADMIN].description,
        },
        {
          name: ROLE_NAMES.OWNER,
          systemKey: RoleSystemKey.OWNER,
          isSystem: true,
          isPlatformRole: false,
          description: ROLE_METADATA[ROLE_NAMES.OWNER].description,
        },
      ];

      for (const config of globalRolesConfig) {
        let role = await roleRepo.findOne({
          where: { name: config.name, workspaceId: IsNull() },
        });

        if (!role) {
          role = roleRepo.create({
            name: config.name,
            systemKey: config.systemKey,
            isSystem: config.isSystem,
            isPlatformRole: config.isPlatformRole,
            description: config.description,
            workspaceId: null,
          });
        } else {
          role.systemKey = config.systemKey;
          role.isSystem = config.isSystem;
          role.isPlatformRole = config.isPlatformRole;
          role.description = config.description;
        }

        const saved = await roleRepo.save(role);
        globalRoleMap.set(config.name, saved);
      }

      // 2. Reconcile Permission Catalog with metadata
      const existingPerms = await permRepo.find();
      const existingPermMap = new Map(existingPerms.map((p) => [p.key, p]));
      const newlyAddedKeys: TPermissionKey[] = [];

      for (const meta of Object.values(PERMISSION_CATALOG)) {
        let perm = existingPermMap.get(meta.key);
        if (!perm) {
          perm = permRepo.create(meta);
          newlyAddedKeys.push(meta.key);
        } else {
          perm.module = meta.module;
          perm.moduleLabel = meta.moduleLabel;
          perm.label = meta.label;
          perm.description = meta.description;
          perm.sortOrder = meta.sortOrder;
          perm.moduleSortOrder = meta.moduleSortOrder;
          perm.isPlatform = meta.isPlatform;
          perm.isAssignable = meta.isAssignable;
        }
        await permRepo.save(perm);
      }

      // 3. SuperAdmin Role Permissions (Platform only)
      const superAdminRole = globalRoleMap.get(ROLE_NAMES.SUPER_ADMIN);
      if (superAdminRole) {
        const saPermRecords = await permRepo.find({
          where: SUPERADMIN_PERMISSIONS.map((k) => ({ key: k })),
        });
        const currentSaPerms = await rolePermRepo.find({
          where: { roleId: superAdminRole.id },
        });
        const currentPermIdSet = new Set(
          currentSaPerms.map((rp) => rp.permissionId),
        );

        const toInsert = saPermRecords
          .filter((p) => !currentPermIdSet.has(p.id))
          .map((p) =>
            rolePermRepo.create({
              roleId: superAdminRole.id,
              permissionId: p.id,
            }),
          );

        if (toInsert.length > 0) {
          await rolePermRepo.save(toInsert);
        }
      }

      // Remove any legacy static permissions on Owner (Owner has dynamic permissions)
      const ownerRole = globalRoleMap.get(ROLE_NAMES.OWNER);
      if (ownerRole) {
        await rolePermRepo.delete({ roleId: ownerRole.id });
      }

      // 4. Ensure Workspace System Roles exist for all workspaces
      const provisioner = new WorkspaceRoleProvisioner(manager.connection);
      const workspaces = await workspaceRepo.find({ select: { id: true } });

      for (const ws of workspaces) {
        const roles = await provisioner.provision(ws.id, manager);

        // If brand-new permission keys were introduced, grant them if included in template
        if (newlyAddedKeys.length > 0) {
          for (const role of roles) {
            if (!role.systemKey) continue;
            const template =
              WORKSPACE_ROLE_TEMPLATES[
                role.systemKey as keyof typeof WORKSPACE_ROLE_TEMPLATES
              ];
            if (!template) continue;

            const relevantNewKeys = newlyAddedKeys.filter((k) =>
              template.permissions.includes(k),
            );
            if (relevantNewKeys.length === 0) continue;

            const permsToGrant = await permRepo.find({
              where: relevantNewKeys.map((k) => ({ key: k })),
            });
            for (const p of permsToGrant) {
              const exists = await rolePermRepo.findOne({
                where: { roleId: role.id, permissionId: p.id },
              });
              if (!exists) {
                await rolePermRepo.save(
                  rolePermRepo.create({
                    roleId: role.id,
                    permissionId: p.id,
                  }),
                );
              }
            }
          }
        }
      }

      process.stdout.write(
        `[SeedRoles] Complete: Global roles verified, ${Object.keys(PERMISSION_CATALOG).length} permissions cataloged, ` +
          `${workspaces.length} workspaces ensured with system roles. ` +
          `New permissions added: ${newlyAddedKeys.length}.\n`,
      );
    });

    // Bump catalog version in Redis if connected
    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      });
      await redis.connect();
      await redis.incr(AUTH_CACHE_KEYS.PERMISSION_CATALOG_VERSION);
      await redis.quit();
    } catch {
      // Redis optional during standalone script / offline execution
    }
  } finally {
    if (!initialized) {
      await appDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedRoles()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[SeedRoles Error] ${msg}\n`);
      process.exit(1);
    });
}

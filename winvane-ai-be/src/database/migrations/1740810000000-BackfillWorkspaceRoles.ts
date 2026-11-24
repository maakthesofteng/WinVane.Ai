import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillWorkspaceRoles1740810000000 implements MigrationInterface {
  name = 'BackfillWorkspaceRoles1740810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Mark SuperAdmin and Owner as global system roles
    await queryRunner.query(`
      UPDATE "roles"
      SET "system_key" = 'super_admin', "is_system" = true
      WHERE "name" = 'SuperAdmin' AND "workspace_id" IS NULL;

      UPDATE "roles"
      SET "system_key" = 'owner', "is_system" = true
      WHERE "name" = 'Owner' AND "workspace_id" IS NULL;

      -- Owner permissions are now dynamic in code; remove static DB grants
      DELETE FROM "role_permissions"
      WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "name" = 'Owner' AND "workspace_id" IS NULL);
    `);

    // 2. Ensure new catalog permissions exist with metadata
    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "module", "module_label", "label", "description", "sort_order", "module_sort_order", "is_platform", "is_assignable")
      VALUES
        ('workspace:read', 'workspace', 'Workspace', 'View workspace details', 'View workspace configuration and organization profile', 1, 1, false, true),
        ('workspace:update', 'workspace', 'Workspace', 'Edit workspace settings', 'Modify company profile, branding, and domain settings', 2, 1, false, true),
        ('dashboard:read', 'dashboard', 'Dashboard', 'View dashboard', 'Access primary metrics, charts, and activity streams', 1, 2, false, true),
        ('members:read', 'members', 'Members', 'View members', 'View workspace directory, member profiles, and invite statuses', 1, 3, false, true),
        ('members:invite', 'members', 'Members', 'Invite members', 'Send, resend, and revoke workspace invitations', 2, 3, false, true),
        ('members:update', 'members', 'Members', 'Edit members & change roles', 'Update member profile details, job titles, and assigned roles', 3, 3, false, true),
        ('members:deactivate', 'members', 'Members', 'Deactivate & reactivate members', 'Suspend or restore member access to the workspace', 4, 3, false, true),
        ('teams:read', 'teams', 'Teams', 'View teams', 'Browse teams, departments, and member rosters', 1, 4, false, true),
        ('teams:create', 'teams', 'Teams', 'Create teams', 'Create new teams and assign team leadership', 2, 4, false, true),
        ('teams:update', 'teams', 'Teams', 'Edit teams & departments', 'Rename teams, manage departments, and adjust membership', 3, 4, false, true),
        ('teams:delete', 'teams', 'Teams', 'Delete teams', 'Disband and remove existing teams from the workspace', 4, 4, false, true),
        ('roles:read', 'roles', 'Roles & Permissions', 'View roles & permissions', 'Inspect workspace roles and permission matrix', 1, 5, false, true),
        ('roles:manage', 'roles', 'Roles & Permissions', 'Create roles & edit permissions', 'Create custom roles and customize workspace role permissions', 2, 5, false, true),
        ('security:self', 'security', 'Account Security', 'Manage own security', 'Manage personal password, 2FA credentials, and active sessions', 1, 6, false, false),
        ('admin:access', 'platform', 'Platform Administration', 'Access admin portal', 'Access the dedicated platform SuperAdmin administration portal', 1, 7, true, false),
        ('admin:tenants:read', 'platform', 'Platform Administration', 'View registered workspaces', 'Inspect platform tenants, verification states, and owners', 2, 7, true, false),
        ('admin:audit:read', 'platform', 'Platform Administration', 'Inspect platform audit logs', 'Review global security events and administrative actions', 3, 7, true, false),
        ('admin:stats:read', 'platform', 'Platform Administration', 'View platform telemetry', 'Analyze system-wide metrics, active sessions, and health', 4, 7, true, false)
      ON CONFLICT ("key") DO UPDATE SET
        "module" = EXCLUDED."module",
        "module_label" = EXCLUDED."module_label",
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "sort_order" = EXCLUDED."sort_order",
        "module_sort_order" = EXCLUDED."module_sort_order",
        "is_platform" = EXCLUDED."is_platform",
        "is_assignable" = EXCLUDED."is_assignable";
    `);

    // 3. For each existing workspace, provision Admin, Manager, and Member system roles
    await queryRunner.query(`
      DO $$
      DECLARE
        ws RECORD;
        admin_role_id uuid;
        manager_role_id uuid;
        member_role_id uuid;
      BEGIN
        FOR ws IN SELECT "id" FROM "workspaces" LOOP
          -- Admin Role
          SELECT "id" INTO admin_role_id FROM "roles" WHERE "workspace_id" = ws.id AND "system_key" = 'admin';
          IF admin_role_id IS NULL THEN
            INSERT INTO "roles" ("name", "system_key", "is_system", "is_platform_role", "description", "workspace_id")
            VALUES ('Admin', 'admin', true, false, 'Workspace administrator with team and resource management rights', ws.id)
            RETURNING "id" INTO admin_role_id;

            INSERT INTO "role_permissions" ("role_id", "permission_id")
            SELECT admin_role_id, p."id"
            FROM "permissions" p
            WHERE p."key" IN (
              'workspace:read', 'workspace:update', 'dashboard:read', 'members:read',
              'members:invite', 'members:update', 'members:deactivate', 'teams:read',
              'teams:create', 'teams:update', 'teams:delete', 'roles:read', 'roles:manage', 'security:self'
            )
            ON CONFLICT DO NOTHING;
          END IF;

          -- Manager Role
          SELECT "id" INTO manager_role_id FROM "roles" WHERE "workspace_id" = ws.id AND "system_key" = 'manager';
          IF manager_role_id IS NULL THEN
            INSERT INTO "roles" ("name", "system_key", "is_system", "is_platform_role", "description", "workspace_id")
            VALUES ('Manager', 'manager', true, false, 'Team manager with operational and team oversight rights', ws.id)
            RETURNING "id" INTO manager_role_id;

            INSERT INTO "role_permissions" ("role_id", "permission_id")
            SELECT manager_role_id, p."id"
            FROM "permissions" p
            WHERE p."key" IN (
              'workspace:read', 'dashboard:read', 'members:read', 'teams:read',
              'teams:create', 'teams:update', 'roles:read', 'security:self'
            )
            ON CONFLICT DO NOTHING;
          END IF;

          -- Member Role
          SELECT "id" INTO member_role_id FROM "roles" WHERE "workspace_id" = ws.id AND "system_key" = 'member';
          IF member_role_id IS NULL THEN
            INSERT INTO "roles" ("name", "system_key", "is_system", "is_platform_role", "description", "workspace_id")
            VALUES ('Member', 'member', true, false, 'Standard workspace team member', ws.id)
            RETURNING "id" INTO member_role_id;

            INSERT INTO "role_permissions" ("role_id", "permission_id")
            SELECT member_role_id, p."id"
            FROM "permissions" p
            WHERE p."key" IN (
              'workspace:read', 'dashboard:read', 'members:read', 'teams:read', 'security:self'
            )
            ON CONFLICT DO NOTHING;
          END IF;
        END LOOP;
      END $$;
    `);

    // 4. Remap users from global Admin/Member to workspace-scoped copies
    await queryRunner.query(`
      UPDATE "users" u
      SET "role_id" = r."id"
      FROM "roles" old_r, "roles" r
      WHERE u."role_id" = old_r."id"
        AND old_r."name" = 'Admin'
        AND old_r."workspace_id" IS NULL
        AND r."workspace_id" = u."workspace_id"
        AND r."system_key" = 'admin';

      UPDATE "users" u
      SET "role_id" = r."id"
      FROM "roles" old_r, "roles" r
      WHERE u."role_id" = old_r."id"
        AND old_r."name" = 'Member'
        AND old_r."workspace_id" IS NULL
        AND r."workspace_id" = u."workspace_id"
        AND r."system_key" = 'member';
    `);

    // 5. Delete global Admin and Member roles and their RolePermission rows
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "name" IN ('Admin', 'Member') AND "workspace_id" IS NULL);

      DELETE FROM "roles"
      WHERE "name" IN ('Admin', 'Member') AND "workspace_id" IS NULL;
    `);

    // 6. Delete old placeholder permissions
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions"
        WHERE "key" IN ('team:read', 'team:invite', 'team:manage-roles', 'leads:review')
      );

      DELETE FROM "permissions"
      WHERE "key" IN ('team:read', 'team:invite', 'team:manage-roles', 'leads:review');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create global Admin and Member roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "is_platform_role", "description")
      VALUES
        ('Admin', false, 'Workspace administrator with team and resource management rights'),
        ('Member', false, 'Regular workspace team member')
      ON CONFLICT DO NOTHING;
    `);

    // Best-effort user remapping back to global roles
    await queryRunner.query(`
      UPDATE "users" u
      SET "role_id" = global_r."id"
      FROM "roles" local_r, "roles" global_r
      WHERE u."role_id" = local_r."id"
        AND local_r."system_key" = 'admin'
        AND global_r."name" = 'Admin'
        AND global_r."workspace_id" IS NULL;

      UPDATE "users" u
      SET "role_id" = global_r."id"
      FROM "roles" local_r, "roles" global_r
      WHERE u."role_id" = local_r."id"
        AND local_r."system_key" = 'member'
        AND global_r."name" = 'Member'
        AND global_r."workspace_id" IS NULL;
    `);

    // Delete workspace system roles
    await queryRunner.query(`
      DELETE FROM "roles" WHERE "workspace_id" IS NOT NULL AND "system_key" IN ('admin', 'manager', 'member');
      UPDATE "roles" SET "system_key" = NULL, "is_system" = false WHERE "workspace_id" IS NULL;
    `);
  }
}

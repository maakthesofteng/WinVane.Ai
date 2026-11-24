import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/rolePermission.entity';
import { User } from '../users/entities/user.entity';
import { AuthCoreModule } from '../auth-core/authCore.module';
import { AuditLogModule } from '../audit/auditLog.module';
import { RolesController } from './controllers/roles.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { WorkspaceRoleProvisioner } from './services/workspaceRoleProvisioner.service';
import { RoleResolverService } from './services/roleResolver.service';
import { RoleAssignmentPolicyService } from './services/roleAssignmentPolicy.service';
import { RolePreconditionsService } from './services/rolePreconditions.service';
import { PermissionCatalogService } from './services/permissionCatalog.service';
import { RolesQueryService } from './services/rolesQuery.service';
import { RolesCommandService } from './services/rolesCommand.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission, User]),
    AuthCoreModule,
    AuditLogModule,
  ],
  controllers: [RolesController, PermissionsController],
  providers: [
    WorkspaceRoleProvisioner,
    RoleResolverService,
    RoleAssignmentPolicyService,
    RolePreconditionsService,
    PermissionCatalogService,
    RolesQueryService,
    RolesCommandService,
  ],
  exports: [
    TypeOrmModule,
    WorkspaceRoleProvisioner,
    RoleResolverService,
    RoleAssignmentPolicyService,
    PermissionCatalogService,
    RolesQueryService,
    RolesCommandService,
  ],
})
export class RbacModule {}

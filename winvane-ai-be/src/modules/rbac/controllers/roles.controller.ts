import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAuth } from '../../auth-core/decorators/currentAuth.decorator';
import { RequirePermissions } from '../../auth-core/decorators/requirePermissions.decorator';
import type { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { PERMISSIONS } from '../constants/permissions.constants';
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto } from '../dto';
import type {
  ICreateRoleResult,
  IRoleSummary,
} from '../interfaces/roles.interface';
import { RolesQueryService } from '../services/rolesQuery.service';
import { RolesCommandService } from '../services/rolesCommand.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesQueryService: RolesQueryService,
    private readonly rolesCommandService: RolesCommandService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'List workspace roles and custom roles' })
  @ApiOkResponse({ description: 'List of role summaries' })
  async listRoles(@CurrentAuth() auth: IAuthContext): Promise<IRoleSummary[]> {
    return this.rolesQueryService.listRoles(auth.workspaceId!, auth);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'Get workspace role detail by ID' })
  @ApiOkResponse({ description: 'Role summary with permission keys' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async getRole(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IRoleSummary> {
    return this.rolesQueryService.getRoleById(auth.workspaceId!, id, auth);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Create a new custom workspace role' })
  @ApiCreatedResponse({ description: 'Created role summary' })
  @ApiConflictResponse({ description: 'Role name taken or limit reached' })
  async createRole(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: CreateRoleDto,
  ): Promise<ICreateRoleResult> {
    return this.rolesCommandService.create(auth.workspaceId!, auth, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Update custom role name or description' })
  @ApiOkResponse({ description: 'Updated role summary' })
  @ApiBadRequestResponse({ description: 'System role name immutable' })
  @ApiForbiddenResponse({ description: 'Cannot edit own role or escalation' })
  @ApiConflictResponse({ description: 'Role name taken' })
  async updateRole(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<IRoleSummary> {
    return this.rolesCommandService.update(auth.workspaceId!, id, auth, dto);
  }

  @Put(':id/permissions')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Replace a workspace role permission set' })
  @ApiOkResponse({ description: 'Updated role summary' })
  @ApiBadRequestResponse({ description: 'Invalid permission keys' })
  @ApiForbiddenResponse({
    description: 'Cannot edit own role or grant unheld permissions',
  })
  async updateRolePermissions(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ): Promise<IRoleSummary> {
    return this.rolesCommandService.updatePermissions(
      auth.workspaceId!,
      id,
      auth,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Delete an unused custom workspace role' })
  @ApiNoContentResponse({ description: 'Role deleted successfully' })
  @ApiBadRequestResponse({ description: 'System roles cannot be deleted' })
  @ApiConflictResponse({ description: 'Role is currently assigned to users' })
  @ApiForbiddenResponse({ description: 'Cannot delete own role or escalation' })
  async deleteRole(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.rolesCommandService.delete(auth.workspaceId!, id, auth);
  }
}

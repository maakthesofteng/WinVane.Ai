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
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAuth } from '../../auth-core/decorators/currentAuth.decorator';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../../auth-core/decorators/requirePermissions.decorator';
import type { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { PERMISSIONS } from '../../rbac/constants/permissions.constants';
import {
  CreateDepartmentDto,
  DepartmentsQueryDto,
  UpdateDepartmentDto,
} from '../dto';
import type { IDepartment } from '../interfaces/teams.interface';
import { DepartmentsService } from '../services/departments.service';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'List workspace departments with team counts' })
  @ApiOkResponse({ description: 'List of departments' })
  async list(
    @CurrentAuth() auth: IAuthContext,
    @Query() query: DepartmentsQueryDto,
  ): Promise<IDepartment[]> {
    return this.departmentsService.findAll(auth.workspaceId!, query.search);
  }

  @Post()
  @RequireAnyPermissions(PERMISSIONS.TEAMS_CREATE, PERMISSIONS.TEAMS_UPDATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiCreatedResponse({ description: 'Department created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'DEPARTMENT_NAME_TAKEN' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async create(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: CreateDepartmentDto,
  ): Promise<IDepartment> {
    return this.departmentsService.create(auth.workspaceId!, auth, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TEAMS_UPDATE)
  @ApiOperation({ summary: 'Rename a department' })
  @ApiOkResponse({ description: 'Department updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'DEPARTMENT_NAME_TAKEN' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async update(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<IDepartment> {
    return this.departmentsService.update(auth.workspaceId!, id, auth, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.TEAMS_UPDATE)
  @ApiOperation({
    summary: 'Delete a department (unlinks teams without deleting them)',
  })
  @ApiOkResponse({ description: 'Department deleted successfully' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async delete(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.departmentsService.delete(auth.workspaceId!, id, auth);
  }
}

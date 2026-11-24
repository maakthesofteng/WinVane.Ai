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
  CreateTeamDto,
  MemberOptionsQueryDto,
  TeamsQueryDto,
  UpdateTeamDto,
} from '../dto';
import type {
  IMemberOption,
  ITeamCard,
  ITeamDetail,
} from '../interfaces/teams.interface';
import { TeamsQueryService } from '../services/teamsQuery.service';
import { TeamsCommandService } from '../services/teamsCommand.service';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamsQueryService: TeamsQueryService,
    private readonly teamsCommandService: TeamsCommandService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'List workspace teams with filters and pagination' })
  @ApiOkResponse({ description: 'Paginated list of team cards' })
  async list(
    @CurrentAuth() auth: IAuthContext,
    @Query() query: TeamsQueryDto,
  ): Promise<{
    items: ITeamCard[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return this.teamsQueryService.findAll(auth.workspaceId!, query);
  }

  @Get('member-options')
  @RequireAnyPermissions(PERMISSIONS.TEAMS_CREATE, PERMISSIONS.TEAMS_UPDATE)
  @ApiOperation({
    summary: 'Get role-filtered active workspace members for team slot picker',
  })
  @ApiOkResponse({ description: 'List of member picker options' })
  async getMemberOptions(
    @CurrentAuth() auth: IAuthContext,
    @Query() query: MemberOptionsQueryDto,
  ): Promise<IMemberOption[]> {
    return this.teamsQueryService.getMemberOptions(auth.workspaceId!, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'Get team details and full membership' })
  @ApiOkResponse({ description: 'Team detail record' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  async getDetail(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ITeamDetail> {
    return this.teamsQueryService.findById(auth.workspaceId!, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TEAMS_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new team' })
  @ApiCreatedResponse({ description: 'Team created successfully' })
  @ApiBadRequestResponse({
    description:
      'Validation failure: TEAM_EMPTY, TEAM_MEMBER_INVALID, TEAM_MEMBER_NOT_ACTIVE, TEAM_ADMIN_ROLE_REQUIRED, TEAM_MANAGER_ROLE_REQUIRED, TEAM_MEMBER_ROLE_INVALID, DEPARTMENT_INVALID',
  })
  @ApiConflictResponse({ description: 'TEAM_NAME_TAKEN' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async create(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: CreateTeamDto,
  ): Promise<ITeamDetail> {
    return this.teamsCommandService.create(auth.workspaceId!, auth, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TEAMS_UPDATE)
  @ApiOperation({ summary: 'Update a team (fields and/or memberships)' })
  @ApiOkResponse({ description: 'Team updated successfully' })
  @ApiBadRequestResponse({
    description:
      'Validation failure: TEAM_EMPTY, TEAM_MEMBER_INVALID, TEAM_MEMBER_NOT_ACTIVE, TEAM_ADMIN_ROLE_REQUIRED, TEAM_MANAGER_ROLE_REQUIRED, TEAM_MEMBER_ROLE_INVALID, DEPARTMENT_INVALID',
  })
  @ApiConflictResponse({ description: 'TEAM_NAME_TAKEN' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async update(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<ITeamDetail> {
    return this.teamsCommandService.update(auth.workspaceId!, id, auth, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.TEAMS_DELETE)
  @ApiOperation({ summary: 'Delete a team' })
  @ApiOkResponse({ description: 'Team deleted successfully' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async delete(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.teamsCommandService.delete(auth.workspaceId!, id, auth);
  }
}

import {
  Body,
  Controller,
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
  ApiBearerAuth,
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
  CreateMemberInviteDto,
  MembersQueryDto,
  RoleChangeImpactQueryDto,
  UpdateMemberDto,
} from '../dto';
import type {
  IMemberEditResult,
  IMemberRow,
  IPaginated,
  IRoleChangeImpact,
  IRoleOption,
} from '../interfaces/members.interface';
import { MembersQueryService } from '../services/membersQuery.service';
import { MemberInviteService } from '../services/memberInvite.service';
import { MemberManagementService } from '../services/memberManagement.service';

@ApiTags('Members')
@ApiBearerAuth()
@Controller('members')
export class MembersController {
  constructor(
    private readonly membersQueryService: MembersQueryService,
    private readonly memberInviteService: MemberInviteService,
    private readonly memberManagementService: MemberManagementService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({
    summary: 'List workspace members with filters and pagination',
  })
  @ApiOkResponse({ description: 'Paginated list of workspace members' })
  async list(
    @CurrentAuth() auth: IAuthContext,
    @Query() query: MembersQueryDto,
  ): Promise<IPaginated<IMemberRow>> {
    return this.membersQueryService.list(auth.workspaceId!, query, auth.userId);
  }

  @Get('assignable-roles')
  @RequireAnyPermissions(PERMISSIONS.MEMBERS_INVITE, PERMISSIONS.MEMBERS_UPDATE)
  @ApiOperation({
    summary: 'List workspace roles the caller is allowed to assign',
  })
  @ApiOkResponse({ description: 'List of assignable workspace roles' })
  async getAssignableRoles(
    @CurrentAuth() auth: IAuthContext,
  ): Promise<IRoleOption[]> {
    return this.membersQueryService.getAssignableRoles(auth.workspaceId!, auth);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MEMBERS_READ)
  @ApiOperation({ summary: 'Get workspace member detail' })
  @ApiOkResponse({ description: 'Member detail record' })
  @ApiNotFoundResponse({ description: 'Member not found' })
  async getDetail(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IMemberRow> {
    return this.membersQueryService.detail(auth.workspaceId!, id, auth.userId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MEMBERS_INVITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a new member to the workspace' })
  @ApiCreatedResponse({ description: 'Member invited successfully' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or role not assignable',
  })
  async invite(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: CreateMemberInviteDto,
  ): Promise<IMemberRow> {
    return this.memberInviteService.invite(auth.workspaceId!, auth, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE)
  @ApiOperation({ summary: 'Update member profile or change role' })
  @ApiOkResponse({ description: 'Member updated successfully' })
  async edit(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<IMemberEditResult> {
    return this.memberManagementService.edit(auth.workspaceId!, id, auth, dto);
  }

  @Get(':id/role-change-impact')
  @RequirePermissions(PERMISSIONS.MEMBERS_UPDATE)
  @ApiOperation({
    summary: 'Dry-run preview of team slots affected by a role change',
  })
  @ApiOkResponse({ description: 'List of team slots that would be removed' })
  async getRoleChangeImpact(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RoleChangeImpactQueryDto,
  ): Promise<IRoleChangeImpact> {
    return this.memberManagementService.getRoleChangeImpact(
      auth.workspaceId!,
      id,
      query.roleId,
    );
  }

  @Post(':id/resend-invite')
  @RequirePermissions(PERMISSIONS.MEMBERS_INVITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend invitation email to an invited member' })
  @ApiOkResponse({ description: 'Invitation resent' })
  async resendInvite(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IMemberRow> {
    return this.memberInviteService.resendInvite(auth.workspaceId!, id, auth);
  }

  @Post(':id/revoke-invite')
  @RequirePermissions(PERMISSIONS.MEMBERS_INVITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke pending invitation for an invited member' })
  @ApiOkResponse({
    description: 'Invitation revoked and member set to inactive',
  })
  async revokeInvite(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IMemberRow> {
    return this.memberInviteService.revokeInvite(auth.workspaceId!, id, auth);
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMISSIONS.MEMBERS_DEACTIVATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an active member' })
  @ApiOkResponse({ description: 'Member deactivated' })
  async deactivate(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IMemberRow> {
    return this.memberManagementService.deactivate(auth.workspaceId!, id, auth);
  }

  @Post(':id/reactivate')
  @RequirePermissions(PERMISSIONS.MEMBERS_DEACTIVATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate an inactive member with credentials' })
  @ApiOkResponse({ description: 'Member reactivated' })
  async reactivate(
    @CurrentAuth() auth: IAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IMemberRow> {
    return this.memberManagementService.reactivate(auth.workspaceId!, id, auth);
  }
}

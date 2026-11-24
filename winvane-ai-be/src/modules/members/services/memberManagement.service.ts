import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';
import { TeamMembership } from '../../teams/entities/teamMembership.entity';
import { TeamRole } from '../../teams/enums/teamRole.enum';
import { RoleSystemKey } from '../../rbac/constants/roles.constants';
import { AuthContextService } from '../../auth-core/services/authContext.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { UpdateMemberDto } from '../dto/updateMember.dto';
import {
  IMemberEditResult,
  IMemberRow,
  IRemovedTeamItem,
  IRoleChangeImpact,
} from '../interfaces/members.interface';
import { RoleAssignmentPolicyService } from './roleAssignmentPolicy.service';
import { MembersQueryService } from './membersQuery.service';
import { MemberStatusService } from './memberStatus.service';

@Injectable()
export class MemberManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(TeamMembership)
    private readonly teamMembershipRepository: Repository<TeamMembership>,
    private readonly dataSource: DataSource,
    private readonly authContextService: AuthContextService,
    private readonly auditLogService: AuditLogService,
    private readonly roleAssignmentPolicyService: RoleAssignmentPolicyService,
    private readonly membersQueryService: MembersQueryService,
    private readonly memberStatusService: MemberStatusService,
  ) {}

  async edit(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
    dto: UpdateMemberDto,
  ): Promise<IMemberEditResult> {
    const targetUser = await this.userRepository.findOne({
      where: { id: memberId, workspaceId },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Member not found.');
    }

    this.roleAssignmentPolicyService.assertCanManageTarget(caller, targetUser);
    this.roleAssignmentPolicyService.assertNotSelfRoleChange(
      caller.userId,
      targetUser.id,
      dto.roleId,
    );

    let newRole: Role | null = null;
    if (dto.roleId && dto.roleId !== targetUser.roleId) {
      newRole = await this.roleRepository.findOne({
        where: { id: dto.roleId },
        relations: {
          rolePermissions: {
            permission: true,
          },
        },
      });

      if (
        !newRole ||
        (newRole.workspaceId && newRole.workspaceId !== workspaceId)
      ) {
        throw new ForbiddenException({
          message: 'Role does not belong to this workspace.',
          code: ERROR_CODES.ROLE_NOT_ASSIGNABLE,
        });
      }

      this.roleAssignmentPolicyService.assertCanAssignRole(caller, newRole);
    }

    const removedFromTeams: IRemovedTeamItem[] = [];

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const tmRepo = manager.getRepository(TeamMembership);

      if (newRole && newRole.id !== targetUser.roleId) {
        const memberships = await tmRepo.find({
          where: { userId: targetUser.id },
          relations: { team: true },
        });

        const invalidMemberships = memberships.filter((tm) =>
          this.isSlotInvalidForRole(tm.teamRole, newRole?.systemKey ?? null),
        );

        for (const invalidTm of invalidMemberships) {
          await tmRepo.delete({
            teamId: invalidTm.teamId,
            userId: invalidTm.userId,
          });

          if (invalidTm.team) {
            removedFromTeams.push({
              id: invalidTm.team.id,
              name: invalidTm.team.name,
              teamRole: invalidTm.teamRole,
            });

            await this.auditLogService.record(
              {
                action: AUDIT_ACTIONS.TEAM_MEMBERS_CHANGED,
                result: AuditResult.SUCCESS,
                actorUserId: caller.userId,
                workspaceId,
                targetType: 'team',
                targetId: invalidTm.team.id,
                metadata: {
                  reason: 'role_change_slot_incompatible',
                  userId: targetUser.id,
                  removedRole: invalidTm.teamRole,
                },
              },
              manager,
            );
          }
        }

        await userRepo.update({ id: targetUser.id }, { roleId: newRole.id });

        await this.auditLogService.record(
          {
            action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
            result: AuditResult.SUCCESS,
            actorUserId: caller.userId,
            workspaceId,
            targetType: 'user',
            targetId: targetUser.id,
            metadata: {
              fromRoleId: targetUser.roleId,
              fromRoleName: targetUser.role?.name,
              toRoleId: newRole.id,
              toRoleName: newRole.name,
              removedTeamIds: removedFromTeams.map((t) => t.id),
            },
          },
          manager,
        );
      }

      const changedFields: string[] = [];
      const updatePayload: Partial<User> = {};

      if (
        dto.fullName !== undefined &&
        dto.fullName.trim() !== targetUser.fullName
      ) {
        updatePayload.fullName = dto.fullName.trim();
        changedFields.push('fullName');
      }
      if (dto.phone !== undefined) {
        const formattedPhone = dto.phone ? dto.phone.trim() : null;
        if (formattedPhone !== targetUser.phone) {
          updatePayload.phone = formattedPhone;
          changedFields.push('phone');
        }
      }
      if (dto.jobTitle !== undefined) {
        const formattedJobTitle = dto.jobTitle ? dto.jobTitle.trim() : null;
        if (formattedJobTitle !== targetUser.jobTitle) {
          updatePayload.jobTitle = formattedJobTitle;
          changedFields.push('jobTitle');
        }
      }

      if (changedFields.length > 0) {
        await userRepo.update({ id: targetUser.id }, updatePayload);

        await this.auditLogService.record(
          {
            action: AUDIT_ACTIONS.MEMBER_UPDATED,
            result: AuditResult.SUCCESS,
            actorUserId: caller.userId,
            workspaceId,
            targetType: 'user',
            targetId: targetUser.id,
            metadata: { changedFields },
          },
          manager,
        );
      }
    });

    if (newRole && newRole.id !== targetUser.roleId) {
      await this.authContextService.invalidate(targetUser.id);
    }

    const member = await this.membersQueryService.detail(
      workspaceId,
      targetUser.id,
      caller.userId,
    );

    return { member, removedFromTeams };
  }

  async getRoleChangeImpact(
    workspaceId: string,
    memberId: string,
    newRoleId: string,
  ): Promise<IRoleChangeImpact> {
    const targetUser = await this.userRepository.findOne({
      where: { id: memberId, workspaceId },
    });

    if (!targetUser) {
      throw new NotFoundException('Member not found.');
    }

    const newRole = await this.roleRepository.findOne({
      where: { id: newRoleId },
    });

    if (
      !newRole ||
      (newRole.workspaceId && newRole.workspaceId !== workspaceId)
    ) {
      throw new NotFoundException('Candidate role not found.');
    }

    const memberships = await this.teamMembershipRepository.find({
      where: { userId: targetUser.id },
      relations: { team: true },
    });

    const removedFromTeams: IRemovedTeamItem[] = [];
    for (const tm of memberships) {
      if (
        this.isSlotInvalidForRole(tm.teamRole, newRole.systemKey) &&
        tm.team
      ) {
        removedFromTeams.push({
          id: tm.team.id,
          name: tm.team.name,
          teamRole: tm.teamRole,
        });
      }
    }

    return { removedFromTeams };
  }

  async deactivate(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    return this.memberStatusService.deactivate(workspaceId, memberId, caller);
  }

  async reactivate(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    return this.memberStatusService.reactivate(workspaceId, memberId, caller);
  }

  private isSlotInvalidForRole(
    teamRole: TeamRole,
    roleSystemKey: RoleSystemKey | null,
  ): boolean {
    if (teamRole === TeamRole.ADMIN) {
      return roleSystemKey !== RoleSystemKey.ADMIN;
    }
    if (teamRole === TeamRole.MANAGER) {
      return roleSystemKey !== RoleSystemKey.MANAGER;
    }
    if (teamRole === TeamRole.MEMBER) {
      return (
        roleSystemKey === RoleSystemKey.ADMIN ||
        roleSystemKey === RoleSystemKey.MANAGER ||
        roleSystemKey === RoleSystemKey.OWNER
      );
    }
    return false;
  }
}

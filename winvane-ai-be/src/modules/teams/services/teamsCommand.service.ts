import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamMembership } from '../entities/teamMembership.entity';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { CreateTeamDto, UpdateTeamDto } from '../dto';
import { TeamRole } from '../enums/teamRole.enum';
import { ITeamDetail } from '../interfaces/teams.interface';
import { TeamCompositionValidator } from './teamComposition.validator';
import { TeamsQueryService } from './teamsQuery.service';
import { MembershipDiffService } from './membershipDiff.service';
import { TeamPreconditionsService } from './teamPreconditions.service';

@Injectable()
export class TeamsCommandService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMembership)
    private readonly teamMembershipRepository: Repository<TeamMembership>,
    private readonly teamPreconditionsService: TeamPreconditionsService,
    private readonly teamCompositionValidator: TeamCompositionValidator,
    private readonly membershipDiffService: MembershipDiffService,
    private readonly teamsQueryService: TeamsQueryService,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    workspaceId: string,
    caller: IAuthContext,
    dto: CreateTeamDto,
  ): Promise<ITeamDetail> {
    const memberIds = dto.memberUserIds ?? [];
    this.teamPreconditionsService.assertNonEmpty(
      dto.adminUserId,
      dto.managerUserId,
      memberIds,
    );

    const cleanName = await this.teamPreconditionsService.assertNameUnique(
      workspaceId,
      dto.name,
    );

    await this.teamPreconditionsService.assertDepartmentValid(
      workspaceId,
      dto.departmentId,
    );

    await this.teamCompositionValidator.validateComposition({
      workspaceId,
      adminUserId: dto.adminUserId,
      managerUserId: dto.managerUserId,
      memberUserIds: memberIds,
    });

    const savedTeam = await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const tmRepo = manager.getRepository(TeamMembership);

      const team = teamRepo.create({
        workspaceId,
        name: cleanName,
        description: dto.description?.trim() || null,
        departmentId: dto.departmentId || null,
        createdById: caller.userId,
        updatedById: caller.userId,
      });

      const insertedTeam = await teamRepo.save(team);
      const membershipsToInsert = this.buildInitialMemberships(
        tmRepo,
        insertedTeam.id,
        caller.userId,
        dto.adminUserId,
        dto.managerUserId,
        memberIds,
      );

      if (membershipsToInsert.length > 0) {
        await tmRepo.save(membershipsToInsert);
      }

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.TEAM_CREATED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'team',
          targetId: insertedTeam.id,
          metadata: {
            name: insertedTeam.name,
            memberCount: membershipsToInsert.length,
          },
        },
        manager,
      );

      return insertedTeam;
    });

    return this.teamsQueryService.findById(workspaceId, savedTeam.id);
  }

  async update(
    workspaceId: string,
    id: string,
    caller: IAuthContext,
    dto: UpdateTeamDto,
  ): Promise<ITeamDetail> {
    const team = await this.teamRepository.findOne({
      where: { id, workspaceId },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this workspace.');
    }

    let cleanName: string | undefined;
    if (dto.name !== undefined) {
      cleanName = dto.name.trim();
      if (cleanName.toLowerCase() !== team.name.toLowerCase()) {
        cleanName = await this.teamPreconditionsService.assertNameUnique(
          workspaceId,
          dto.name,
          id,
        );
      }
    }

    await this.teamPreconditionsService.assertDepartmentValid(
      workspaceId,
      dto.departmentId,
    );

    const currentMemberships = await this.teamMembershipRepository.find({
      where: { teamId: id },
    });

    const { currentAdminId, currentManagerId, currentMemberIds } =
      this.extractCurrentRoles(currentMemberships);

    const targetAdminId =
      dto.adminUserId !== undefined ? dto.adminUserId : currentAdminId;
    const targetManagerId =
      dto.managerUserId !== undefined ? dto.managerUserId : currentManagerId;
    const targetMemberIds =
      dto.memberUserIds !== undefined ? dto.memberUserIds : currentMemberIds;

    this.teamPreconditionsService.assertNonEmpty(
      targetAdminId,
      targetManagerId,
      targetMemberIds,
    );

    const membershipChanged =
      dto.adminUserId !== undefined ||
      dto.managerUserId !== undefined ||
      dto.memberUserIds !== undefined;

    if (membershipChanged) {
      await this.teamCompositionValidator.validateComposition({
        workspaceId,
        adminUserId: targetAdminId,
        managerUserId: targetManagerId,
        memberUserIds: targetMemberIds,
        existingTeamId: id,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const fieldChanges = this.applyTeamFieldChanges(
        team,
        cleanName,
        dto.description,
        dto.departmentId,
      );

      team.updatedById = caller.userId;
      await teamRepo.save(team);

      if (Object.keys(fieldChanges).length > 0) {
        await this.auditLogService.record(
          {
            action: AUDIT_ACTIONS.TEAM_UPDATED,
            result: AuditResult.SUCCESS,
            actorUserId: caller.userId,
            workspaceId,
            targetType: 'team',
            targetId: id,
            metadata: { changes: fieldChanges },
          },
          manager,
        );
      }

      if (membershipChanged) {
        await this.membershipDiffService.applyDiff(
          manager,
          id,
          caller.userId,
          workspaceId,
          currentMemberships,
          {
            adminId: targetAdminId,
            managerId: targetManagerId,
            memberIds: targetMemberIds,
          },
          currentAdminId,
          currentManagerId,
        );
      }
    });

    return this.teamsQueryService.findById(workspaceId, id);
  }

  async delete(
    workspaceId: string,
    id: string,
    caller: IAuthContext,
  ): Promise<{ message: string }> {
    const team = await this.teamRepository.findOne({
      where: { id, workspaceId },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this workspace.');
    }

    const memberCount = await this.teamMembershipRepository.count({
      where: { teamId: id },
    });

    await this.teamRepository.delete({ id, workspaceId });

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.TEAM_DELETED,
      result: AuditResult.SUCCESS,
      actorUserId: caller.userId,
      workspaceId,
      targetType: 'team',
      targetId: id,
      metadata: { name: team.name, memberCount },
    });

    return { message: 'Team deleted successfully.' };
  }

  private buildInitialMemberships(
    tmRepo: Repository<TeamMembership>,
    teamId: string,
    actorId: string,
    adminUserId?: string | null,
    managerUserId?: string | null,
    memberUserIds: string[] = [],
  ): TeamMembership[] {
    const list: TeamMembership[] = [];
    if (adminUserId) {
      list.push(
        tmRepo.create({
          teamId,
          userId: adminUserId,
          teamRole: TeamRole.ADMIN,
          addedById: actorId,
        }),
      );
    }
    if (managerUserId) {
      list.push(
        tmRepo.create({
          teamId,
          userId: managerUserId,
          teamRole: TeamRole.MANAGER,
          addedById: actorId,
        }),
      );
    }
    for (const mid of memberUserIds) {
      list.push(
        tmRepo.create({
          teamId,
          userId: mid,
          teamRole: TeamRole.MEMBER,
          addedById: actorId,
        }),
      );
    }
    return list;
  }

  private extractCurrentRoles(currentMemberships: TeamMembership[]) {
    let currentAdminId: string | null = null;
    let currentManagerId: string | null = null;
    const currentMemberIds: string[] = [];

    for (const m of currentMemberships) {
      if (m.teamRole === TeamRole.ADMIN) currentAdminId = m.userId;
      else if (m.teamRole === TeamRole.MANAGER) currentManagerId = m.userId;
      else if (m.teamRole === TeamRole.MEMBER) currentMemberIds.push(m.userId);
    }

    return { currentAdminId, currentManagerId, currentMemberIds };
  }

  private applyTeamFieldChanges(
    team: Team,
    cleanName?: string,
    description?: string | null,
    departmentId?: string | null,
  ): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (cleanName !== undefined && cleanName !== team.name) {
      changes.name = { from: team.name, to: cleanName };
      team.name = cleanName;
    }
    if (description !== undefined && description !== team.description) {
      const descVal = description?.trim() || null;
      changes.description = { from: team.description, to: descVal };
      team.description = descVal;
    }
    if (departmentId !== undefined && departmentId !== team.departmentId) {
      const deptVal = departmentId || null;
      changes.departmentId = { from: team.departmentId, to: deptVal };
      team.departmentId = deptVal;
    }

    return changes;
  }
}

import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TeamMembership } from '../entities/teamMembership.entity';
import { TeamRole } from '../enums/teamRole.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';

export interface ITargetComposition {
  adminId: string | null;
  managerId: string | null;
  memberIds: string[];
}

@Injectable()
export class MembershipDiffService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async applyDiff(
    manager: EntityManager,
    teamId: string,
    callerUserId: string,
    workspaceId: string,
    currentMemberships: TeamMembership[],
    target: ITargetComposition,
    currentAdminId: string | null,
    currentManagerId: string | null,
  ): Promise<void> {
    const tmRepo = manager.getRepository(TeamMembership);

    const currentMap = new Map<string, TeamRole>(
      currentMemberships.map((m) => [m.userId, m.teamRole]),
    );
    const targetMap = new Map<string, TeamRole>();

    if (target.adminId) targetMap.set(target.adminId, TeamRole.ADMIN);
    if (target.managerId) targetMap.set(target.managerId, TeamRole.MANAGER);
    for (const mid of target.memberIds) {
      targetMap.set(mid, TeamRole.MEMBER);
    }

    const added: string[] = [];
    const removed: string[] = [];

    // 1. Deletions
    for (const current of currentMemberships) {
      if (!targetMap.has(current.userId)) {
        removed.push(current.userId);
        await tmRepo.delete({ teamId, userId: current.userId });
      }
    }

    // 2. Insertions & Updates
    for (const [userId, targetRole] of targetMap.entries()) {
      const currentRole = currentMap.get(userId);
      if (!currentRole) {
        added.push(userId);
        const newMembership = tmRepo.create({
          teamId,
          userId,
          teamRole: targetRole,
          addedById: callerUserId,
        });
        await tmRepo.save(newMembership);
      } else if (currentRole !== targetRole) {
        await tmRepo.update({ teamId, userId }, { teamRole: targetRole });
      }
    }

    // 3. Audit if changes occurred
    const adminChanged = currentAdminId !== target.adminId;
    const managerChanged = currentManagerId !== target.managerId;

    if (
      added.length > 0 ||
      removed.length > 0 ||
      adminChanged ||
      managerChanged
    ) {
      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.TEAM_MEMBERS_CHANGED,
          result: AuditResult.SUCCESS,
          actorUserId: callerUserId,
          workspaceId,
          targetType: 'team',
          targetId: teamId,
          metadata: { added, removed, adminChanged, managerChanged },
        },
        manager,
      );
    }
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { TeamMembership } from '../entities/teamMembership.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { RoleSystemKey } from '../../rbac/constants/roles.constants';
import { TeamRole } from '../enums/teamRole.enum';
import {
  ERROR_CODES,
  TErrorCode,
} from '../../../common/constants/errorCodes.constants';

export interface ICompositionValidationParams {
  workspaceId: string;
  adminUserId?: string | null;
  managerUserId?: string | null;
  memberUserIds?: string[];
  existingTeamId?: string;
}

interface IViolation {
  path: string;
  message: string;
  code: TErrorCode;
}

@Injectable()
export class TeamCompositionValidator {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(TeamMembership)
    private readonly teamMembershipRepository: Repository<TeamMembership>,
  ) {}

  async validateComposition(
    params: ICompositionValidationParams,
  ): Promise<Map<string, User>> {
    const {
      workspaceId,
      adminUserId,
      managerUserId,
      memberUserIds = [],
      existingTeamId,
    } = params;

    const violations: IViolation[] = [];

    // 1. Fetch workspace to identify owner
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    const ownerUserId = workspace?.ownerUserId ?? null;

    // 2. Fetch existing memberships if PATCH
    let existingAdminId: string | null = null;
    let existingManagerId: string | null = null;
    const existingMemberIds = new Set<string>();

    if (existingTeamId) {
      const existingMemberships = await this.teamMembershipRepository.find({
        where: { teamId: existingTeamId },
      });
      for (const m of existingMemberships) {
        if (m.teamRole === TeamRole.ADMIN) existingAdminId = m.userId;
        else if (m.teamRole === TeamRole.MANAGER) existingManagerId = m.userId;
        else if (m.teamRole === TeamRole.MEMBER)
          existingMemberIds.add(m.userId);
      }
    }

    // 3. Collect unique user IDs and query
    const allIds = [
      ...(adminUserId ? [adminUserId] : []),
      ...(managerUserId ? [managerUserId] : []),
      ...memberUserIds,
    ];
    const uniqueIds = Array.from(new Set(allIds));

    const users =
      uniqueIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(uniqueIds) },
            relations: { role: true },
          })
        : [];
    const usersMap = new Map<string, User>(users.map((u) => [u.id, u]));

    // 4. Cross-slot conflict between Admin and Manager
    if (adminUserId && managerUserId && adminUserId === managerUserId) {
      violations.push({
        path: 'managerUserId',
        message:
          'User cannot be both Team Admin and Team Manager in the same team',
        code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
      });
    }

    // 5. Validate Admin Slot
    if (adminUserId) {
      const user = usersMap.get(adminUserId);
      if (!user || user.workspaceId !== workspaceId) {
        violations.push({
          path: 'adminUserId',
          message: 'User does not belong to this workspace',
          code: ERROR_CODES.TEAM_MEMBER_INVALID,
        });
      } else {
        const isExistingAdmin = Boolean(
          existingTeamId && existingAdminId === adminUserId,
        );
        if (user.status !== UserStatus.ACTIVE && !isExistingAdmin) {
          violations.push({
            path: 'adminUserId',
            message: 'User must be active to be assigned as Team Admin',
            code: ERROR_CODES.TEAM_MEMBER_NOT_ACTIVE,
          });
        }

        const isOwner =
          user.id === ownerUserId ||
          user.role?.systemKey === RoleSystemKey.OWNER ||
          user.role?.name === 'Owner';
        if (isOwner) {
          violations.push({
            path: 'adminUserId',
            message: 'Workspace Owner cannot be assigned to team slots',
            code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
          });
        } else if (user.role?.systemKey !== RoleSystemKey.ADMIN) {
          violations.push({
            path: 'adminUserId',
            message: 'Team Admin must have the workspace Admin role',
            code: ERROR_CODES.TEAM_ADMIN_ROLE_REQUIRED,
          });
        }
      }
    }

    // 5. Validate Manager Slot
    if (managerUserId) {
      const user = usersMap.get(managerUserId);
      if (!user || user.workspaceId !== workspaceId) {
        violations.push({
          path: 'managerUserId',
          message: 'User does not belong to this workspace',
          code: ERROR_CODES.TEAM_MEMBER_INVALID,
        });
      } else {
        const isExistingManager = Boolean(
          existingTeamId && existingManagerId === managerUserId,
        );
        if (user.status !== UserStatus.ACTIVE && !isExistingManager) {
          violations.push({
            path: 'managerUserId',
            message: 'User must be active to be assigned as Team Manager',
            code: ERROR_CODES.TEAM_MEMBER_NOT_ACTIVE,
          });
        }

        const isOwner =
          user.id === ownerUserId ||
          user.role?.systemKey === RoleSystemKey.OWNER ||
          user.role?.name === 'Owner';
        if (isOwner) {
          violations.push({
            path: 'managerUserId',
            message: 'Workspace Owner cannot be assigned to team slots',
            code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
          });
        } else if (user.role?.systemKey !== RoleSystemKey.MANAGER) {
          violations.push({
            path: 'managerUserId',
            message: 'Team Manager must have the workspace Manager role',
            code: ERROR_CODES.TEAM_MANAGER_ROLE_REQUIRED,
          });
        }
      }
    }

    // 7. Validate Member Slots
    const seenMembers = new Set<string>();
    for (let i = 0; i < memberUserIds.length; i++) {
      const mid = memberUserIds[i];
      const fieldPath = `memberUserIds[${i}]`;

      if (seenMembers.has(mid)) {
        violations.push({
          path: fieldPath,
          message: 'Duplicate member in team members list',
          code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
        });
        continue;
      }
      seenMembers.add(mid);

      if (adminUserId && mid === adminUserId) {
        violations.push({
          path: fieldPath,
          message: 'User cannot be both Team Admin and Team Member',
          code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
        });
      }
      if (managerUserId && mid === managerUserId) {
        violations.push({
          path: fieldPath,
          message: 'User cannot be both Team Manager and Team Member',
          code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
        });
      }

      const user = usersMap.get(mid);
      if (!user || user.workspaceId !== workspaceId) {
        violations.push({
          path: fieldPath,
          message: 'User does not belong to this workspace',
          code: ERROR_CODES.TEAM_MEMBER_INVALID,
        });
      } else {
        const isExistingMember = Boolean(
          existingTeamId && existingMemberIds.has(mid),
        );
        if (user.status !== UserStatus.ACTIVE && !isExistingMember) {
          violations.push({
            path: fieldPath,
            message: 'User must be active to be added as a team member',
            code: ERROR_CODES.TEAM_MEMBER_NOT_ACTIVE,
          });
        }

        const isOwner =
          user.id === ownerUserId ||
          user.role?.systemKey === RoleSystemKey.OWNER ||
          user.role?.name === 'Owner';
        const isSystemAdminOrManager =
          user.role?.systemKey === RoleSystemKey.ADMIN ||
          user.role?.systemKey === RoleSystemKey.MANAGER;

        if (isOwner) {
          violations.push({
            path: fieldPath,
            message: 'Workspace Owner cannot be added to a team',
            code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
          });
        } else if (isSystemAdminOrManager) {
          violations.push({
            path: fieldPath,
            message:
              'Team members must not have Owner, Admin, or Manager roles',
            code: ERROR_CODES.TEAM_MEMBER_ROLE_INVALID,
          });
        }
      }
    }

    if (violations.length > 0) {
      const messages = violations.map((v) => `${v.path}: ${v.message}`);
      const primaryCode = violations[0].code;
      throw new BadRequestException({
        message: messages,
        code: primaryCode,
      });
    }

    return usersMap;
  }
}

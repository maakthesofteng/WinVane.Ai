import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';
import { TeamMembership } from '../../teams/entities/teamMembership.entity';
import { Invitation } from '../../invitations/entities/invitation.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import {
  ROLE_NAMES,
  RoleSystemKey,
} from '../../rbac/constants/roles.constants';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { MembersQueryDto } from '../dto/membersQuery.dto';
import {
  IMemberInvitation,
  IMemberRow,
  IMemberTeam,
  IPaginated,
  IRoleOption,
} from '../interfaces/members.interface';

const ALLOWED_MEMBER_STATUSES = [
  UserStatus.INVITED,
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
];

@Injectable()
export class MembersQueryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(TeamMembership)
    private readonly teamMembershipRepository: Repository<TeamMembership>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
  ) {}

  async list(
    workspaceId: string,
    query: MembersQueryDto,
    callerId: string,
  ): Promise<IPaginated<IMemberRow>> {
    const page = Math.max(1, query.page || 1);
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.workspace_id = :workspaceId', { workspaceId })
      .andWhere('user.status IN (:...allowedStatuses)', {
        allowedStatuses: ALLOWED_MEMBER_STATUSES,
      });

    if (query.roleId) {
      qb.andWhere('user.role_id = :roleId', { roleId: query.roleId });
    }

    if (
      query.status &&
      ALLOWED_MEMBER_STATUSES.includes(query.status as UserStatus)
    ) {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    if (query.teamId) {
      qb.innerJoin(
        'team_memberships',
        'filter_tm',
        'filter_tm.user_id = user.id AND filter_tm.team_id = :teamId',
        { teamId: query.teamId },
      );
    }

    if (query.search && query.search.trim().length > 0) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.full_name) LIKE :term OR LOWER(user.email) LIKE :term)',
        { term },
      );
    }

    const sortDir = (query.sortDir || 'desc').toUpperCase() as 'ASC' | 'DESC';
    switch (query.sortBy) {
      case 'fullName':
        qb.orderBy('user.fullName', sortDir);
        break;
      case 'email':
        qb.orderBy('user.email', sortDir);
        break;
      case 'role':
        qb.orderBy('role.name', sortDir);
        break;
      case 'status':
        qb.orderBy('user.status', sortDir);
        break;
      case 'lastLoginAt':
        qb.orderBy('user.lastLoginAt', sortDir, 'NULLS LAST');
        break;
      case 'createdAt':
      default:
        qb.orderBy('user.createdAt', sortDir);
        break;
    }

    qb.skip(skip).take(pageSize);

    const [users, total] = await qb.getManyAndCount();
    const userIds = users.map((u) => u.id);

    const [teamsMap, invitationsMap] = await Promise.all([
      this.batchLoadTeams(userIds),
      this.batchLoadInvitations(userIds),
    ]);

    const items = users.map((u) =>
      this.mapToMemberRow(
        u,
        callerId,
        teamsMap.get(u.id) || [],
        invitationsMap.get(u.id) || null,
      ),
    );

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async detail(
    workspaceId: string,
    memberId: string,
    callerId: string,
  ): Promise<IMemberRow> {
    const user = await this.userRepository.findOne({
      where: {
        id: memberId,
        workspaceId,
        status: In(ALLOWED_MEMBER_STATUSES),
      },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Member not found.');
    }

    const [teamsMap, invitationsMap] = await Promise.all([
      this.batchLoadTeams([user.id]),
      this.batchLoadInvitations([user.id]),
    ]);

    return this.mapToMemberRow(
      user,
      callerId,
      teamsMap.get(user.id) || [],
      invitationsMap.get(user.id) || null,
    );
  }

  async getAssignableRoles(
    workspaceId: string,
    caller: IAuthContext,
  ): Promise<IRoleOption[]> {
    const roles = await this.roleRepository.find({
      where: {
        workspaceId,
        isPlatformRole: false,
      },
      relations: {
        rolePermissions: {
          permission: true,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const isOwnerCaller = caller.roleSystemKey === RoleSystemKey.OWNER;
    const callerPerms = new Set(caller.permissions || []);

    const nonOwnerRoles = roles.filter(
      (role) =>
        role.systemKey !== RoleSystemKey.OWNER &&
        role.name !== ROLE_NAMES.OWNER,
    );

    return nonOwnerRoles
      .filter((role) => {
        if (isOwnerCaller) {
          return true;
        }
        const perms = (role.rolePermissions || [])
          .map((rp) => rp.permission?.key)
          .filter((k): k is string => Boolean(k));
        return perms.every((p) => callerPerms.has(p));
      })
      .map((role) => ({
        id: role.id,
        name: role.name,
        systemKey: role.systemKey ?? null,
        description: role.description,
        isCustom: !role.isSystem && !role.systemKey,
      }));
  }

  private async batchLoadTeams(
    userIds: string[],
  ): Promise<Map<string, IMemberTeam[]>> {
    const map = new Map<string, IMemberTeam[]>();
    if (userIds.length === 0) {
      return map;
    }

    const memberships = await this.teamMembershipRepository.find({
      where: { userId: In(userIds) },
      relations: { team: true },
    });

    for (const tm of memberships) {
      if (!tm.team) continue;
      const list = map.get(tm.userId) || [];
      list.push({
        id: tm.team.id,
        name: tm.team.name,
        teamRole: tm.teamRole,
      });
      map.set(tm.userId, list);
    }

    return map;
  }

  private async batchLoadInvitations(
    userIds: string[],
  ): Promise<Map<string, IMemberInvitation>> {
    const map = new Map<string, IMemberInvitation>();
    if (userIds.length === 0) {
      return map;
    }

    const invitations = await this.invitationRepository.find({
      where: { userId: In(userIds) },
      order: { createdAt: 'DESC' },
    });

    for (const inv of invitations) {
      if (!map.has(inv.userId)) {
        map.set(inv.userId, {
          status: inv.status as 'pending' | 'expired' | 'revoked',
          expiresAt: inv.expiresAt.toISOString(),
          lastSentAt: inv.lastSentAt.toISOString(),
        });
      }
    }

    return map;
  }

  private mapToMemberRow(
    user: User,
    callerId: string,
    teams: IMemberTeam[],
    invitation: IMemberInvitation | null,
  ): IMemberRow {
    const isOwner =
      user.role?.systemKey === RoleSystemKey.OWNER ||
      user.role?.name === ROLE_NAMES.OWNER;

    const isSelf = user.id === callerId;
    const showInvite =
      user.status === UserStatus.INVITED ||
      (user.status === UserStatus.INACTIVE && user.passwordHash === null);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      jobTitle: user.jobTitle,
      role: {
        id: user.role?.id ?? user.roleId,
        name: user.role?.name ?? 'Unknown',
        systemKey: this.resolveMemberSystemKey(user.role?.systemKey),
      },
      teams,
      status: user.status as 'invited' | 'active' | 'inactive',
      isOwner,
      isSelf,
      invitation: showInvite ? invitation : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private resolveMemberSystemKey(
    systemKey: RoleSystemKey | null | undefined,
  ): 'owner' | 'admin' | 'manager' | 'member' | null {
    if (
      systemKey === RoleSystemKey.OWNER ||
      systemKey === RoleSystemKey.ADMIN ||
      systemKey === RoleSystemKey.MANAGER ||
      systemKey === RoleSystemKey.MEMBER
    ) {
      return systemKey;
    }
    return null;
  }
}

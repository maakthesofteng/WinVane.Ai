import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamMembership } from '../entities/teamMembership.entity';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { TeamRole } from '../enums/teamRole.enum';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { RoleSystemKey } from '../../rbac/constants/roles.constants';
import {
  ITeamCard,
  ITeamDetail,
  ITeamPerson,
  IMemberOption,
} from '../interfaces/teams.interface';
import { MemberOptionsQueryDto, TeamsQueryDto } from '../dto';

function toTeamPerson(user: User): ITeamPerson {
  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    jobTitle: user.jobTitle ?? null,
    status: user.status === UserStatus.ACTIVE ? 'active' : 'inactive',
    roleName: user.role?.name ?? '',
  };
}

@Injectable()
export class TeamsQueryService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMembership)
    private readonly teamMembershipRepository: Repository<TeamMembership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  async findAll(
    workspaceId: string,
    query: TeamsQueryDto,
  ): Promise<{
    items: ITeamCard[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const sortBy = query.sortBy ?? 'name';
    const sortDir = (query.sortDir?.toUpperCase() as 'ASC' | 'DESC') ?? 'ASC';

    const qb = this.teamRepository
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.department', 'dept')
      .where('team.workspace_id = :workspaceId', { workspaceId });

    if (query.search?.trim()) {
      qb.andWhere('LOWER(team.name) LIKE :search', {
        search: `%${query.search.trim().toLowerCase()}%`,
      });
    }

    if (query.departmentId) {
      qb.andWhere('team.department_id = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    if (query.memberUserId) {
      qb.andWhere((subQb) => {
        const sub = subQb
          .subQuery()
          .select('1')
          .from(TeamMembership, 'filter_tm')
          .where('filter_tm.team_id = team.id')
          .andWhere('filter_tm.user_id = :filterUserId', {
            filterUserId: query.memberUserId,
          })
          .getQuery();
        return `EXISTS ${sub}`;
      });
    }

    if (sortBy === 'memberCount') {
      qb.addSelect((subQb) => {
        return subQb
          .select('COUNT(cnt_tm.user_id)', 'cnt')
          .from(TeamMembership, 'cnt_tm')
          .where('cnt_tm.team_id = team.id');
      }, 'member_count_sort');
      qb.orderBy('member_count_sort', sortDir);
    } else if (sortBy === 'createdAt') {
      qb.orderBy('team.createdAt', sortDir);
    } else {
      qb.orderBy('team.name', sortDir);
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [teams, total] = await qb.getManyAndCount();

    if (teams.length === 0) {
      return {
        items: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    }

    const teamIds = teams.map((t) => t.id);
    const memberships = await this.teamMembershipRepository.find({
      where: { teamId: In(teamIds) },
      relations: {
        user: {
          role: true,
        },
      },
    });

    const membershipsByTeam = new Map<string, TeamMembership[]>();
    for (const m of memberships) {
      const list = membershipsByTeam.get(m.teamId) ?? [];
      list.push(m);
      membershipsByTeam.set(m.teamId, list);
    }

    const items: ITeamCard[] = teams.map((team) => {
      const teamMems = membershipsByTeam.get(team.id) ?? [];
      const adminMem = teamMems.find((m) => m.teamRole === TeamRole.ADMIN);
      const managerMem = teamMems.find((m) => m.teamRole === TeamRole.MANAGER);
      const plainMembers = teamMems
        .filter((m) => m.teamRole === TeamRole.MEMBER && m.user)
        .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        department: team.department
          ? { id: team.department.id, name: team.department.name }
          : null,
        admin: adminMem?.user ? toTeamPerson(adminMem.user) : null,
        manager: managerMem?.user ? toTeamPerson(managerMem.user) : null,
        memberCount: teamMems.length,
        membersPreview: plainMembers
          .slice(0, 5)
          .map((m) => toTeamPerson(m.user)),
        updatedAt: team.updatedAt.toISOString(),
        createdAt: team.createdAt.toISOString(),
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async findById(workspaceId: string, id: string): Promise<ITeamDetail> {
    const team = await this.teamRepository.findOne({
      where: { id, workspaceId },
      relations: { department: true, createdBy: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this workspace.');
    }

    const memberships = await this.teamMembershipRepository.find({
      where: { teamId: id },
      relations: {
        user: {
          role: true,
        },
      },
    });

    const adminMem = memberships.find((m) => m.teamRole === TeamRole.ADMIN);
    const managerMem = memberships.find((m) => m.teamRole === TeamRole.MANAGER);
    const plainMembers = memberships
      .filter((m) => m.teamRole === TeamRole.MEMBER && m.user)
      .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      department: team.department
        ? { id: team.department.id, name: team.department.name }
        : null,
      admin: adminMem?.user ? toTeamPerson(adminMem.user) : null,
      manager: managerMem?.user ? toTeamPerson(managerMem.user) : null,
      memberCount: memberships.length,
      membersPreview: plainMembers.slice(0, 5).map((m) => toTeamPerson(m.user)),
      members: plainMembers.map((m) => toTeamPerson(m.user)),
      createdBy: team.createdBy
        ? { id: team.createdBy.id, fullName: team.createdBy.fullName }
        : null,
      updatedAt: team.updatedAt.toISOString(),
      createdAt: team.createdAt.toISOString(),
    };
  }

  async getMemberOptions(
    workspaceId: string,
    query: MemberOptionsQueryDto,
  ): Promise<IMemberOption[]> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    const ownerUserId = workspace?.ownerUserId;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('user.workspace_id = :workspaceId', { workspaceId })
      .andWhere('user.status = :activeStatus', {
        activeStatus: UserStatus.ACTIVE,
      });

    // Exclude owner
    if (ownerUserId) {
      qb.andWhere('user.id != :ownerUserId', { ownerUserId });
    }
    qb.andWhere('role.system_key != :ownerKey', {
      ownerKey: RoleSystemKey.OWNER,
    });
    qb.andWhere('role.name != :ownerRoleName', { ownerRoleName: 'Owner' });

    // Pool filter
    if (query.pool === 'admin') {
      qb.andWhere('role.system_key = :adminKey', {
        adminKey: RoleSystemKey.ADMIN,
      });
    } else if (query.pool === 'manager') {
      qb.andWhere('role.system_key = :managerKey', {
        managerKey: RoleSystemKey.MANAGER,
      });
    } else {
      // member pool: not admin, manager, or owner
      qb.andWhere('role.system_key NOT IN (:...systemKeys)', {
        systemKeys: [
          RoleSystemKey.ADMIN,
          RoleSystemKey.MANAGER,
          RoleSystemKey.OWNER,
        ],
      });
    }

    if (query.search?.trim()) {
      qb.andWhere(
        '(LOWER(user.full_name) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${query.search.trim().toLowerCase()}%` },
      );
    }

    const limit = Math.min(query.limit ?? 20, 50);
    qb.orderBy('user.fullName', 'ASC').take(limit);

    const users = await qb.getMany();

    // If teamId is passed, include current slot holders even if inactive
    if (query.teamId) {
      await this.includeExistingSlotHolders(
        query.teamId,
        query.pool,
        users,
        query.search,
        ownerUserId,
      );
    }

    return users.map((u) => ({
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      jobTitle: u.jobTitle ?? null,
      roleName: u.role?.name ?? '',
      status: u.status === UserStatus.ACTIVE ? 'active' : 'inactive',
    }));
  }

  private async includeExistingSlotHolders(
    teamId: string,
    pool: 'admin' | 'manager' | 'member',
    users: User[],
    search?: string,
    ownerUserId?: string | null,
  ): Promise<void> {
    const targetRole =
      pool === 'admin'
        ? TeamRole.ADMIN
        : pool === 'manager'
          ? TeamRole.MANAGER
          : TeamRole.MEMBER;

    const existingMems = await this.teamMembershipRepository.find({
      where: { teamId, teamRole: targetRole },
      relations: { user: { role: true } },
    });

    const userIds = new Set(users.map((u) => u.id));
    const searchLower = search?.trim().toLowerCase();

    for (const em of existingMems) {
      if (!em.user || userIds.has(em.user.id)) continue;
      if (em.user.id === ownerUserId) continue;

      if (searchLower) {
        const matchName = em.user.fullName.toLowerCase().includes(searchLower);
        const matchEmail = em.user.email.toLowerCase().includes(searchLower);
        if (!matchName && !matchEmail) continue;
      }

      users.push(em.user);
      userIds.add(em.user.id);
    }
  }
}

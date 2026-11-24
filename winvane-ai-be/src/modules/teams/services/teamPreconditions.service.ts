import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Department } from '../entities/department.entity';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class TeamPreconditionsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  assertNonEmpty(
    adminId?: string | null,
    managerId?: string | null,
    memberIds: string[] = [],
  ): void {
    const total = (adminId ? 1 : 0) + (managerId ? 1 : 0) + memberIds.length;
    if (total === 0) {
      throw new BadRequestException({
        message: 'A team must have at least one person.',
        code: ERROR_CODES.TEAM_EMPTY,
      });
    }
  }

  async assertNameUnique(
    workspaceId: string,
    name: string,
    excludeTeamId?: string,
  ): Promise<string> {
    const cleanName = name.trim();
    let qb = this.teamRepository
      .createQueryBuilder('team')
      .where('team.workspace_id = :workspaceId', { workspaceId })
      .andWhere('LOWER(team.name) = LOWER(:name)', { name: cleanName });

    if (excludeTeamId) {
      qb = qb.andWhere('team.id != :id', { id: excludeTeamId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException({
        message: 'A team with this name already exists in this workspace.',
        code: ERROR_CODES.TEAM_NAME_TAKEN,
      });
    }
    return cleanName;
  }

  async assertDepartmentValid(
    workspaceId: string,
    departmentId?: string | null,
  ): Promise<void> {
    if (!departmentId) {
      return;
    }
    const dept = await this.departmentRepository.findOne({
      where: { id: departmentId, workspaceId },
    });
    if (!dept) {
      throw new BadRequestException({
        message: 'Invalid department.',
        code: ERROR_CODES.DEPARTMENT_INVALID,
      });
    }
  }
}

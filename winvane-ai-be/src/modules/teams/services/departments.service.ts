import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
import { Team } from '../entities/team.entity';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../dto';
import { IDepartment } from '../interfaces/teams.interface';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(workspaceId: string, search?: string): Promise<IDepartment[]> {
    const qb = this.departmentRepository
      .createQueryBuilder('dept')
      .leftJoin('dept.teams', 'team')
      .select('dept.id', 'id')
      .addSelect('dept.name', 'name')
      .addSelect('COUNT(team.id)', 'teamCount')
      .where('dept.workspace_id = :workspaceId', { workspaceId })
      .groupBy('dept.id')
      .addGroupBy('dept.name')
      .orderBy('dept.name', 'ASC');

    if (search && search.trim().length > 0) {
      qb.andWhere('LOWER(dept.name) LIKE :search', {
        search: `%${search.trim().toLowerCase()}%`,
      });
    }

    const rows = await qb.getRawMany<{
      id: string;
      name: string;
      teamCount: string;
    }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      teamCount: parseInt(r.teamCount, 10) || 0,
    }));
  }

  async create(
    workspaceId: string,
    caller: IAuthContext,
    dto: CreateDepartmentDto,
  ): Promise<IDepartment> {
    const cleanName = dto.name.trim();

    // Check unique per workspace (case-insensitive)
    const existing = await this.departmentRepository
      .createQueryBuilder('dept')
      .where('dept.workspace_id = :workspaceId', { workspaceId })
      .andWhere('LOWER(dept.name) = LOWER(:name)', { name: cleanName })
      .getOne();

    if (existing) {
      throw new ConflictException({
        message:
          'A department with this name already exists in this workspace.',
        code: ERROR_CODES.DEPARTMENT_NAME_TAKEN,
      });
    }

    const department = this.departmentRepository.create({
      workspaceId,
      name: cleanName,
      createdById: caller.userId,
    });

    const saved = await this.departmentRepository.save(department);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.DEPARTMENT_CREATED,
      result: AuditResult.SUCCESS,
      actorUserId: caller.userId,
      workspaceId,
      targetType: 'department',
      targetId: saved.id,
      metadata: { name: saved.name },
    });

    return {
      id: saved.id,
      name: saved.name,
      teamCount: 0,
    };
  }

  async update(
    workspaceId: string,
    id: string,
    caller: IAuthContext,
    dto: UpdateDepartmentDto,
  ): Promise<IDepartment> {
    const department = await this.departmentRepository.findOne({
      where: { id, workspaceId },
    });

    if (!department) {
      throw new NotFoundException('Department not found in this workspace.');
    }

    const cleanName = dto.name.trim();

    if (cleanName.toLowerCase() !== department.name.toLowerCase()) {
      const existing = await this.departmentRepository
        .createQueryBuilder('dept')
        .where('dept.workspace_id = :workspaceId', { workspaceId })
        .andWhere('LOWER(dept.name) = LOWER(:name)', { name: cleanName })
        .andWhere('dept.id != :id', { id })
        .getOne();

      if (existing) {
        throw new ConflictException({
          message:
            'A department with this name already exists in this workspace.',
          code: ERROR_CODES.DEPARTMENT_NAME_TAKEN,
        });
      }
    }

    const oldName = department.name;
    department.name = cleanName;
    await this.departmentRepository.save(department);

    const teamCount = await this.teamRepository.count({
      where: { departmentId: id, workspaceId },
    });

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.DEPARTMENT_UPDATED,
      result: AuditResult.SUCCESS,
      actorUserId: caller.userId,
      workspaceId,
      targetType: 'department',
      targetId: id,
      metadata: { oldName, newName: cleanName },
    });

    return {
      id: department.id,
      name: department.name,
      teamCount,
    };
  }

  async delete(
    workspaceId: string,
    id: string,
    caller: IAuthContext,
  ): Promise<{ message: string }> {
    const department = await this.departmentRepository.findOne({
      where: { id, workspaceId },
    });

    if (!department) {
      throw new NotFoundException('Department not found in this workspace.');
    }

    await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const deptRepo = manager.getRepository(Department);

      // Nullify department on teams
      await teamRepo.update(
        { departmentId: id, workspaceId },
        { departmentId: null },
      );

      // Delete department
      await deptRepo.delete({ id, workspaceId });
    });

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.DEPARTMENT_DELETED,
      result: AuditResult.SUCCESS,
      actorUserId: caller.userId,
      workspaceId,
      targetType: 'department',
      targetId: id,
      metadata: { name: department.name },
    });

    return { message: 'Department deleted successfully.' };
  }
}

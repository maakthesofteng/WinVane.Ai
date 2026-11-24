import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RoleSystemKey } from '../constants/roles.constants';

@Injectable()
export class RoleResolverService {
  constructor(private readonly dataSource: DataSource) {}

  async getWorkspaceRole(
    workspaceId: string,
    systemKey: RoleSystemKey,
    manager?: EntityManager,
  ): Promise<Role | null> {
    const em = manager ?? this.dataSource.manager;
    return em.getRepository(Role).findOne({
      where: {
        workspaceId,
        systemKey,
      },
    });
  }
}

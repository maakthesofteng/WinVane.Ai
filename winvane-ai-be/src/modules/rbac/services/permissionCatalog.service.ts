import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { RoleAssignmentPolicyService } from './roleAssignmentPolicy.service';
import {
  IPermissionCatalogResponse,
  IPermissionGroup,
} from '../interfaces/roles.interface';

@Injectable()
export class PermissionCatalogService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly roleAssignmentPolicy: RoleAssignmentPolicyService,
  ) {}

  async getCatalog(caller: IAuthContext): Promise<IPermissionCatalogResponse> {
    const permissions = await this.permissionRepository.find({
      where: {
        isPlatform: false,
        isAssignable: true,
      },
      order: {
        moduleSortOrder: 'ASC',
        module: 'ASC',
        sortOrder: 'ASC',
        key: 'ASC',
      },
    });

    const groupsMap = new Map<string, IPermissionGroup>();

    for (const perm of permissions) {
      const moduleKey = perm.module;
      if (!groupsMap.has(moduleKey)) {
        groupsMap.set(moduleKey, {
          module: perm.module,
          moduleLabel: perm.moduleLabel || perm.module,
          permissions: [],
        });
      }
      const group = groupsMap.get(moduleKey)!;
      group.permissions.push({
        key: perm.key,
        label: perm.label || perm.key,
        description: perm.description,
      });
    }

    const allAssignableKeys = permissions.map((p) => p.key);
    const grantableKeys = this.roleAssignmentPolicy.getGrantableKeys(
      caller,
      allAssignableKeys,
    );

    return {
      groups: Array.from(groupsMap.values()),
      grantableKeys,
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAuth } from '../../auth-core/decorators/currentAuth.decorator';
import { RequirePermissions } from '../../auth-core/decorators/requirePermissions.decorator';
import type { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { PERMISSIONS } from '../constants/permissions.constants';
import { PermissionCatalogService } from '../services/permissionCatalog.service';
import type { IPermissionCatalogResponse } from '../interfaces/roles.interface';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionCatalogService: PermissionCatalogService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({
    summary:
      'Get all tenant permissions grouped by module with caller grantable keys',
  })
  @ApiOkResponse({
    description: 'Grouped permission catalog and caller grantable keys',
  })
  async getCatalog(
    @CurrentAuth() auth: IAuthContext,
  ): Promise<IPermissionCatalogResponse> {
    return this.permissionCatalogService.getCatalog(auth);
  }
}

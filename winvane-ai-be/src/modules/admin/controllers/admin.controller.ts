import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminPortal } from '../../auth-core/decorators/adminPortal.decorator';
import { RequirePermissions } from '../../auth-core/decorators/requirePermissions.decorator';

@ApiTags('Admin')
@Controller('admin')
@AdminPortal()
@RequirePermissions('admin:access')
export class AdminController {
  // Placeholder controller for Admin shell features (tenants, audit log, dashboard)
  // Endpoints will be implemented in Phase 5 and subsequent modules.
}

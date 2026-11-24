import { ForbiddenException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { WorkspaceStatus } from '../../workspace/enums/workspaceStatus.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

export function assertUserAndWorkspaceActive(user: User): void {
  if (user.status === UserStatus.PENDING) {
    throw new ForbiddenException({
      code: ERROR_CODES.EMAIL_NOT_VERIFIED,
      message: 'Please verify your email first.',
    });
  }
  if (user.status === UserStatus.INACTIVE) {
    throw new ForbiddenException({
      code: ERROR_CODES.ACCOUNT_INACTIVE,
      message:
        'Your account has been deactivated. Contact your workspace admin.',
    });
  }
  if (user.status === UserStatus.SUSPENDED) {
    throw new ForbiddenException({
      code: ERROR_CODES.ACCOUNT_SUSPENDED,
      message: 'Your account is suspended.',
    });
  }
  if (user.workspace?.status === WorkspaceStatus.SUSPENDED) {
    throw new ForbiddenException({
      code: ERROR_CODES.WORKSPACE_SUSPENDED,
      message: 'Your workspace is suspended.',
    });
  }
}

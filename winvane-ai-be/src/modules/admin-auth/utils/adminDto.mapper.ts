import { User } from '../../users/entities/user.entity';
import { IAdminUserDto } from '../dto/adminAuthResponse.dto';

export function mapUserToAdminUserDto(
  user: User,
  permissions: string[],
): IAdminUserDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: 'SuperAdmin',
    isPlatformRole: true,
    workspaceId: null,
    permissions,
    mfaEnabled: true,
  };
}

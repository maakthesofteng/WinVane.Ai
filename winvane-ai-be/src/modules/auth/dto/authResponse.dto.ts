import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IAuthUserDto,
  IWorkspaceSummaryDto,
  IGenericMessageResponse,
  IRedirectMessageResponse,
  IAuthLoginSuccessResponse,
  IAuthLoginMfaRequiredResponse,
  IAuthMeResponse,
} from '../interfaces/authResponse.interface';

export class AuthUserDto implements IAuthUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'alice@acme.com' })
  email!: string;

  @ApiProperty({ example: 'Alice Smith' })
  fullName!: string;

  @ApiProperty({ enum: ['Owner', 'Admin', 'Member'], example: 'Owner' })
  role!: 'Owner' | 'Admin' | 'Member';

  @ApiProperty({ example: false })
  isPlatformRole!: false;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  workspaceId!: string;

  @ApiProperty({ type: [String], example: ['workspace:read', 'security:self'] })
  permissions!: string[];

  @ApiProperty({ example: false })
  mfaEnabled!: boolean;
}

export class WorkspaceSummaryDto implements IWorkspaceSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id!: string;

  @ApiProperty({ example: 'Acme Software Labs' })
  name!: string;

  @ApiProperty({ example: 'acme.com' })
  domain!: string;

  @ApiProperty({ enum: ['active'], example: 'active' })
  status!: 'active';

  @ApiProperty({ enum: ['free', 'pilot', 'pro'], example: 'free' })
  planTier!: 'free' | 'pilot' | 'pro';
}

export class GenericMessageDto implements IGenericMessageResponse {
  @ApiProperty({
    example:
      "If the details are valid, we've sent a verification link to your inbox.",
  })
  message!: string;
}

export class RedirectMessageDto implements IRedirectMessageResponse {
  @ApiProperty({ example: 'Email verified. You can now sign in.' })
  message!: string;

  @ApiProperty({ example: '/login' })
  redirectTo!: string;
}

export class AuthLoginSuccessDto implements IAuthLoginSuccessResponse {
  @ApiProperty({ example: 'authenticated' })
  status!: 'authenticated';

  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: () => WorkspaceSummaryDto })
  workspace!: WorkspaceSummaryDto;

  @ApiPropertyOptional({ example: 'BACKUP_CODE_USED' })
  warning?: string;

  @ApiPropertyOptional({ example: 7 })
  backupCodesRemaining?: number;
}

export class AuthLoginMfaRequiredDto implements IAuthLoginMfaRequiredResponse {
  @ApiProperty({ example: 'mfa_required' })
  status!: 'mfa_required';
}

export class AuthMeDto implements IAuthMeResponse {
  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: () => WorkspaceSummaryDto })
  workspace!: WorkspaceSummaryDto;
}

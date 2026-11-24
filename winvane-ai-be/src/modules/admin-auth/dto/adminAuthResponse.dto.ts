import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface IAdminUserDto {
  id: string;
  email: string;
  fullName: string;
  role: 'SuperAdmin';
  isPlatformRole: true;
  workspaceId: string | null;
  permissions: string[];
  mfaEnabled: true;
}

export class AdminUserDto implements IAdminUserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id!: string;

  @ApiProperty({ example: 'superadmin@winvane.ai' })
  email!: string;

  @ApiProperty({ example: 'System SuperAdministrator' })
  fullName!: string;

  @ApiProperty({ example: 'SuperAdmin', enum: ['SuperAdmin'] })
  role!: 'SuperAdmin';

  @ApiProperty({ example: true, type: Boolean })
  isPlatformRole!: true;

  @ApiProperty({ example: null, nullable: true, type: String })
  workspaceId!: string | null;

  @ApiProperty({
    example: ['admin:access', 'admin:audit:read'],
    type: [String],
  })
  permissions!: string[];

  @ApiProperty({ example: true, type: Boolean })
  mfaEnabled!: true;
}

export class AdminLoginChallengeResponseDto {
  @ApiProperty({
    example: 'mfa_required',
    enum: ['mfa_setup_required', 'mfa_required'],
  })
  status!: 'mfa_setup_required' | 'mfa_required';
}

export class AdminMfaSetupResponseDto {
  @ApiProperty({
    example: 'otpauth://totp/WinVane.ai:admin@winvane.ai?secret=...',
  })
  otpauthUrl!: string;

  @ApiProperty({ example: 'JBSWY3DPEHPK3PXP' })
  secret!: string;
}

export class AdminMfaSetupConfirmResponseDto {
  @ApiProperty({ example: 'authenticated', type: String })
  status!: 'authenticated';

  @ApiProperty({ type: () => AdminUserDto })
  user!: AdminUserDto;

  @ApiProperty({
    example: ['ABCD-EFGH', '1234-5678'],
    type: [String],
    description: '10 one-time recovery backup codes. Displayed only once.',
  })
  backupCodes!: string[];
}

export class AdminMfaVerifyResponseDto {
  @ApiProperty({ example: 'authenticated', type: String })
  status!: 'authenticated';

  @ApiProperty({ type: () => AdminUserDto })
  user!: AdminUserDto;

  @ApiPropertyOptional({ example: 'BACKUP_CODE_USED', type: String })
  warning?: 'BACKUP_CODE_USED';

  @ApiPropertyOptional({ example: 9, type: Number })
  backupCodesRemaining?: number;
}

export class AdminMeResponseDto {
  @ApiProperty({ type: () => AdminUserDto })
  user!: AdminUserDto;
}

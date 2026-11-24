import { ApiProperty } from '@nestjs/swagger';

export class MfaStatusDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: '2026-10-31T12:00:00.000Z', nullable: true })
  confirmedAt: string | null;

  @ApiProperty({ example: 10 })
  backupCodesRemaining: number;

  @ApiProperty({
    example: true,
    description:
      'Whether current user is permitted to disable 2FA (false for SuperAdmin)',
  })
  canDisable: boolean;
}

export class MfaSetupResponseDto {
  @ApiProperty({
    example: 'otpauth://totp/WinVane.ai:user@acme.com?secret=...',
  })
  otpauthUrl: string;

  @ApiProperty({ example: 'JBSWY3DPEHPK3PXP' })
  secret: string;
}

export class MfaBackupCodesResponseDto {
  @ApiProperty({
    example: ['A1B2-C3D4', 'E5F6-G7H8'],
    isArray: true,
    type: String,
  })
  backupCodes: string[];
}

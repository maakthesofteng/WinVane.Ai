import { ApiProperty } from '@nestjs/swagger';
import type { TDeviceType } from '../../../common/utils/userAgent.util';

export interface ISessionView {
  id: string;
  current: boolean;
  ipAddress: string;
  browser: string;
  os: string;
  deviceType: TDeviceType;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export class SessionViewDto implements ISessionView {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: true })
  current: boolean;

  @ApiProperty({ example: '192.168.1.1' })
  ipAddress: string;

  @ApiProperty({ example: 'Chrome' })
  browser: string;

  @ApiProperty({ example: 'Windows' })
  os: string;

  @ApiProperty({
    example: 'desktop',
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
  })
  deviceType: TDeviceType;

  @ApiProperty({ example: '2026-10-31T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-10-31T12:05:00.000Z' })
  lastSeenAt: string;

  @ApiProperty({ example: '2026-11-01T12:00:00.000Z' })
  expiresAt: string;
}

export class RevokeOthersResponseDto {
  @ApiProperty({ example: 3, description: 'Number of active sessions revoked' })
  revokedCount: number;
}

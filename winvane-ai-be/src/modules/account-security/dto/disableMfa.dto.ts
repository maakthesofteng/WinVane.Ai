import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DisableMfaDto {
  @ApiProperty({
    example: 'CurrentPassword123!',
    description: 'Current password for step-up verification',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: '123456',
    description: 'Current 6-digit TOTP code or backup code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

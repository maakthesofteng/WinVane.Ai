import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty({
    description: 'Raw invitation token received via email link',
    example: '5a41bfd7e4cf8d752f4be8c74384a6c4293f0b2f5d96205cf379cfcf2c8e030a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Password chosen by user for account activation',
    example: 'SecurePassw0rd!2026',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

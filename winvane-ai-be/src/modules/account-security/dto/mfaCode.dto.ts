import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MfaCodeDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit time-based one-time authentication code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

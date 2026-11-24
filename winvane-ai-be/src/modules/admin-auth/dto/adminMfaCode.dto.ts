import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminMfaCodeDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit TOTP code or alphanumeric backup code',
  })
  @IsString({ message: 'Verification code must be a string.' })
  @IsNotEmpty({ message: 'Verification code is required.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  code!: string;
}

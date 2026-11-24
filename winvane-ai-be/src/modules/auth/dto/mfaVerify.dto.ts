import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({
    description: '6-digit TOTP code or single-use backup code',
    example: '123456',
    minLength: 6,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(6, 10)
  code!: string;
}

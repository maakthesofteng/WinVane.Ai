import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Work email address',
    example: 'alice@acme.com',
    maxLength: 254,
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Account password',
    example: 'SecretP@ssw0rd!2026',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

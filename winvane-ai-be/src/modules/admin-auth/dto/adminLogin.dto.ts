import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    example: 'superadmin@winvane.ai',
    description: 'SuperAdmin email address',
  })
  @IsEmail({}, { message: 'Must be a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    example: 'AdminP@ssw0rd123!',
    description: 'SuperAdmin account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password!: string;
}

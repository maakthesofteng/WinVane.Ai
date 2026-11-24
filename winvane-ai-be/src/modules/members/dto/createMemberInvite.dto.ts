import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { isE164Phone } from './validators/isE164Phone.validator';

export class CreateMemberInviteDto {
  @ApiProperty({
    example: 'Jane Doe',
    description: 'Full name of the invited member (2-120 characters)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  fullName: string;

  @ApiProperty({
    example: 'jane.doe@example.com',
    description: 'Email address of the invited member',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({
    example: '+14155552671',
    description: 'Optional E.164 format phone number',
  })
  @IsOptional()
  @ValidateIf((_obj, val) => val !== null && val !== undefined && val !== '')
  @isE164Phone()
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'Senior Product Manager',
    description: 'Optional job title (up to 100 characters)',
  })
  @IsOptional()
  @ValidateIf((_obj, val) => val !== null && val !== undefined && val !== '')
  @IsString()
  @MaxLength(100)
  jobTitle?: string | null;

  @ApiProperty({
    example: 'a0000000-0000-0000-0000-000000000002',
    description: 'UUID of the role to assign to the new member',
  })
  @IsUUID('4')
  roleId: string;
}

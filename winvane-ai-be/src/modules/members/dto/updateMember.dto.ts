import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { isE164Phone } from './validators/isE164Phone.validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Updated full name (2-120 characters)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @ApiPropertyOptional({
    example: '+14155552671',
    description: 'Updated E.164 phone number, or null to clear',
  })
  @IsOptional()
  @ValidateIf((_obj, val) => val !== null && val !== undefined && val !== '')
  @isE164Phone()
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'VP of Engineering',
    description: 'Updated job title, or null to clear',
  })
  @IsOptional()
  @ValidateIf((_obj, val) => val !== null && val !== undefined && val !== '')
  @IsString()
  @MaxLength(100)
  jobTitle?: string | null;

  @ApiPropertyOptional({
    example: 'a0000000-0000-0000-0000-000000000003',
    description: 'Updated role UUID',
  })
  @IsOptional()
  @IsUUID('4')
  roleId?: string;
}

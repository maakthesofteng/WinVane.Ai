import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTeamDto {
  @ApiPropertyOptional({
    description: 'Team name (unique per workspace)',
    example: 'Engineering',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    description: 'Department UUID or null to clear',
    example: null,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4')
  departmentId?: string | null;

  @ApiPropertyOptional({
    description: 'Team description (up to 500 characters) or null to clear',
    example: 'Core platform engineering',
    nullable: true,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({
    description: 'User UUID for Team Admin or null to clear',
    example: null,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4')
  adminUserId?: string | null;

  @ApiPropertyOptional({
    description: 'User UUID for Team Manager or null to clear',
    example: null,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4')
  managerUserId?: string | null;

  @ApiPropertyOptional({
    description:
      'User UUIDs for Team Members (replaces existing list; [] to clear)',
    example: [],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  memberUserIds?: string[];
}

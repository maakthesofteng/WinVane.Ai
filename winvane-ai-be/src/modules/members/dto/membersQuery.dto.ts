import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class MembersQueryDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: 'Page number (1-based)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    default: 10,
    enum: [10, 20, 50, 100],
    description: 'Number of items per page (10, 20, 50, or 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 50, 100], {
    message: 'pageSize must be one of: 10, 20, 50, 100',
  })
  pageSize: number = 10;

  @ApiPropertyOptional({
    description:
      'Search by full name or email (case-insensitive, max 100 chars)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role UUID',
  })
  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @ApiPropertyOptional({
    enum: ['invited', 'active', 'inactive'],
    description: 'Filter by member status',
  })
  @IsOptional()
  @IsIn(['invited', 'active', 'inactive'])
  status?: 'invited' | 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Filter by team UUID',
  })
  @IsOptional()
  @IsUUID('4')
  teamId?: string;

  @ApiPropertyOptional({
    default: 'createdAt',
    enum: ['fullName', 'email', 'role', 'status', 'createdAt', 'lastLoginAt'],
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsIn(['fullName', 'email', 'role', 'status', 'createdAt', 'lastLoginAt'])
  sortBy:
    'fullName' | 'email' | 'role' | 'status' | 'createdAt' | 'lastLoginAt' =
    'createdAt';

  @ApiPropertyOptional({
    default: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir: 'asc' | 'desc' = 'desc';
}

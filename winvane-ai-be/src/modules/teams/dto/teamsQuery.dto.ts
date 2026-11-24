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

export class TeamsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of cards per page (12, 24, or 48)',
    default: 12,
    enum: [12, 24, 48],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([12, 24, 48])
  pageSize?: number = 12;

  @ApiPropertyOptional({
    description: 'Search term for team name',
    example: 'Engineering',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Department UUID',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter teams containing this member User UUID',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  memberUserId?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'createdAt', 'memberCount'],
    default: 'name',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'memberCount'])
  sortBy?: 'name' | 'createdAt' | 'memberCount' = 'name';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'asc';
}

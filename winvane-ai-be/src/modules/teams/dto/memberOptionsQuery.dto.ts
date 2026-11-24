import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class MemberOptionsQueryDto {
  @ApiProperty({
    description: 'Member role pool to pick from',
    enum: ['admin', 'manager', 'member'],
  })
  @IsNotEmpty()
  @IsIn(['admin', 'manager', 'member'])
  pool: 'admin' | 'manager' | 'member';

  @ApiPropertyOptional({
    description: 'Search term for name or email',
    example: 'Sara',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Max results (1 to 50)',
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Existing team UUID when editing (keeps current slot holder even if inactive)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  teamId?: string;
}

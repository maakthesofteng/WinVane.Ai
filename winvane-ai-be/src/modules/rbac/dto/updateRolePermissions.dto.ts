import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    description: 'Array of assignable permission keys for the role (max 200)',
    example: ['teams:read', 'teams:create', 'members:read'],
  })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) return value;
    const cleanList = value
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim());
    return Array.from(new Set(cleanList));
  })
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  permissionKeys: string[];
}

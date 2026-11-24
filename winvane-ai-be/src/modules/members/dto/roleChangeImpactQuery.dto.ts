import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RoleChangeImpactQueryDto {
  @ApiProperty({
    description: 'UUID of the candidate new role',
    example: 'a0000000-0000-0000-0000-000000000003',
  })
  @IsUUID('4')
  @IsNotEmpty()
  roleId: string;
}

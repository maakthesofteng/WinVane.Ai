import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StepUpDto {
  @ApiProperty({
    example: 'CurrentPassword123!',
    description: 'Current password for step-up re-authentication',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;
}

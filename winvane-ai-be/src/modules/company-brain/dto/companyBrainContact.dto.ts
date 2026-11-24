import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CompanyBrainContactDto {
  @ApiProperty({ maxLength: 120, example: 'Avery Johnson' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ maxLength: 254, example: 'avery@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  workEmail: string;

  @ApiPropertyOptional({ maxLength: 32, example: '+1 555 010 1234' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactNumber?: string;

  @ApiPropertyOptional({ maxLength: 120, example: 'Delivery Lead' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;
}

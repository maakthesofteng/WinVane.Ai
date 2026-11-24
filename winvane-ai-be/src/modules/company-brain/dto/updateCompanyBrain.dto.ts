import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CompanyBrainCaseStudyDto } from './companyBrainCaseStudy.dto';
import { CompanyBrainContactDto } from './companyBrainContact.dto';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimStringArray = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value)
    ? value.map((item: unknown) =>
        typeof item === 'string' ? item.trim() : item,
      )
    : value;

export class UpdateCompanyBrainDto {
  @ApiProperty({ type: [String], example: ['React', 'Node.js'] })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  techStacks: string[];

  @ApiProperty({ type: [String], example: ['Financial services'] })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  industries: string[];

  @ApiProperty({ type: [String], example: ['Product development'] })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  services: string[];

  @ApiProperty({ type: [String], example: ['North America'] })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  targetRegions: string[];

  @ApiProperty({ example: '11-50 employees', maxLength: 80 })
  @Transform(trimString)
  @IsString()
  @MaxLength(80)
  companySizeBand: string;

  @ApiProperty({ example: '$50,000-$100,000', maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  pricingRange: string;

  @ApiProperty({ example: 'Fixed price', maxLength: 80 })
  @Transform(trimString)
  @IsString()
  @MaxLength(80)
  pricingModel: string;

  @ApiProperty({ example: 'We build software for... ', maxLength: 2000 })
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  summary: string;

  @ApiProperty({ example: 'https://example.com', maxLength: 2048 })
  @Transform(trimString)
  @IsString()
  @MaxLength(2048)
  @ValidateIf((_, value) => Boolean(value))
  @IsUrl({ require_protocol: true })
  websiteUrl: string;

  @ApiProperty({ enum: ['draft', 'confirmed'] })
  @IsIn(['draft', 'confirmed'])
  status: 'draft' | 'confirmed';

  @ApiProperty({ type: [CompanyBrainContactDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => CompanyBrainContactDto)
  @ValidateNested({ each: true })
  contacts?: CompanyBrainContactDto[];

  @ApiProperty({ type: [CompanyBrainCaseStudyDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @Type(() => CompanyBrainCaseStudyDto)
  @ValidateNested({ each: true })
  caseStudies?: CompanyBrainCaseStudyDto[];
}

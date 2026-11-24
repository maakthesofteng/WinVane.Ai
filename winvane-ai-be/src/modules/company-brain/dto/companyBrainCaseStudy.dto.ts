import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import type { ICompanyBrainRichTextNode } from '../interfaces/companyBrain.interface';
import { IsCompanyBrainRichTextDocument } from './companyBrainRichText.validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CompanyBrainCaseStudyDto {
  @ApiProperty({ maxLength: 200, example: 'Modernizing a healthcare platform' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ maxLength: 160, example: 'Acme Health' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  clientName?: string;

  @ApiPropertyOptional({ maxLength: 120, example: 'Healthcare' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @ApiProperty({
    description:
      'TipTap document JSON. Only supported text, formatting and link nodes are accepted.',
    type: Object,
  })
  @IsObject()
  @Type(() => Object)
  @Validate(IsCompanyBrainRichTextDocument)
  content: ICompanyBrainRichTextNode;
}

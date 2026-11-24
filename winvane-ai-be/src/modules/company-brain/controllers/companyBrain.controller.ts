import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentAuth } from '../../auth-core/decorators/currentAuth.decorator';
import { RequirePermissions } from '../../auth-core/decorators/requirePermissions.decorator';
import type { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { PERMISSIONS } from '../../rbac/constants/permissions.constants';
import { UpdateCompanyBrainDto } from '../dto/updateCompanyBrain.dto';
import type {
  ICompanyBrainExtractionResponse,
  ICompanyBrainResponse,
} from '../interfaces/companyBrain.interface';
import { CompanyBrainPdfService } from '../services/companyBrainPdf.service';
import { CompanyBrainService } from '../services/companyBrain.service';

interface IUploadedPdfFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('Company Brain')
@ApiBearerAuth()
@Controller('company-brain')
export class CompanyBrainController {
  constructor(
    private readonly companyBrainService: CompanyBrainService,
    private readonly companyBrainPdfService: CompanyBrainPdfService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ApiOperation({ summary: 'Get the current workspace Company Brain profile' })
  @ApiOkResponse({ description: 'Company Brain profile' })
  async getProfile(
    @CurrentAuth() auth: IAuthContext,
  ): Promise<ICompanyBrainResponse> {
    return this.companyBrainService.getProfile(auth.workspaceId!);
  }

  @Put()
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @ApiOperation({ summary: 'Save the current workspace Company Brain profile' })
  @ApiOkResponse({ description: 'Saved profile and incremented version' })
  async saveProfile(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: UpdateCompanyBrainDto,
  ): Promise<ICompanyBrainResponse> {
    return this.companyBrainService.saveProfile(
      auth.workspaceId!,
      auth.userId,
      dto,
    );
  }

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  @ApiOperation({
    summary: 'Extract Company Brain fields from an uploaded PDF',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Extracted fields for user review' })
  async extractFromPdf(
    @UploadedFile() file: IUploadedPdfFile,
  ): Promise<ICompanyBrainExtractionResponse> {
    return this.companyBrainPdfService.extract(file);
  }
}

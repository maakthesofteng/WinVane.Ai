import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public, SkipCsrf } from '../../common/decorators';
import { CsrfService } from './csrf.service';

@ApiTags('Security')
@Controller('security')
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get('csrf-token')
  @Public()
  @SkipCsrf()
  @ApiOperation({ summary: 'Retrieve CSRF token and set cookie' })
  @ApiResponse({
    status: 200,
    description: 'Returns the CSRF token and sets the HTTP-only cookie',
    schema: {
      type: 'object',
      properties: {
        csrfToken: { type: 'string' },
      },
    },
  })
  getCsrfToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { csrfToken: string } {
    const csrfToken = this.csrfService.generateToken(req, res);
    return { csrfToken };
  }
}

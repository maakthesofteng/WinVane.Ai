import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { THROTTLER_NAME_ADMIN_AUTH } from '../../../common/constants';
import { SkipCsrf } from '../../../common/decorators';
import { AdminPortal } from '../../auth-core/decorators/adminPortal.decorator';
import { Public } from '../../auth-core/decorators/public.decorator';
import { RequirePermissions } from '../../auth-core/decorators/requirePermissions.decorator';
import { CurrentAuth } from '../../auth-core/decorators/currentAuth.decorator';
import type { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { AdminLoginService } from '../services/adminLogin.service';
import { AdminMfaEnrollmentService } from '../services/adminMfaEnrollment.service';
import {
  AdminLoginDto,
  AdminMfaCodeDto,
  AdminLoginChallengeResponseDto,
  AdminMfaSetupResponseDto,
  AdminMfaSetupConfirmResponseDto,
  AdminMfaVerifyResponseDto,
  AdminMeResponseDto,
} from '../dto';

@ApiTags('Admin Auth')
@Controller('admin/auth')
@AdminPortal()
export class AdminAuthController {
  private readonly mfaCookieName: string;

  constructor(
    private readonly adminLoginService: AdminLoginService,
    private readonly adminMfaEnrollmentService: AdminMfaEnrollmentService,
    private readonly configService: ConfigService,
  ) {
    this.mfaCookieName = this.configService.get<string>(
      'cookie.mfaChallengeCookieName',
      'wv_mfa_challenge',
    );
  }

  @Post('login')
  @Public()
  @Throttle({
    [THROTTLER_NAME_ADMIN_AUTH]: { limit: 5, ttl: 900000 },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate SuperAdmin password and issue MFA challenge',
  })
  @ApiOkResponse({ type: AdminLoginChallengeResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account locked',
  })
  async login(
    @Body() dto: AdminLoginDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminLoginChallengeResponseDto> {
    const userAgent = req.headers['user-agent'];
    return this.adminLoginService.login(dto, ip, userAgent, res);
  }

  @Post('mfa/setup')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate TOTP MFA enrollment for SuperAdmin',
  })
  @ApiOkResponse({ type: AdminMfaSetupResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired setup challenge',
  })
  async beginMfaSetup(@Req() req: Request): Promise<AdminMfaSetupResponseDto> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const challengeCookie = cookies?.[this.mfaCookieName];
    const userAgent = req.headers['user-agent'];
    return this.adminMfaEnrollmentService.beginSetup(
      challengeCookie,
      userAgent,
    );
  }

  @Post('mfa/setup/confirm')
  @Public()
  @Throttle({
    [THROTTLER_NAME_ADMIN_AUTH]: { limit: 5, ttl: 900000 },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm TOTP MFA enrollment and issue initial SuperAdmin session',
  })
  @ApiOkResponse({ type: AdminMfaSetupConfirmResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid verification code or expired setup challenge',
  })
  async confirmMfaSetup(
    @Body() dto: AdminMfaCodeDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminMfaSetupConfirmResponseDto> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const challengeCookie = cookies?.[this.mfaCookieName];
    const userAgent = req.headers['user-agent'];
    return this.adminMfaEnrollmentService.confirmSetup(
      dto,
      challengeCookie,
      ip,
      userAgent,
      res,
    );
  }

  @Post('mfa/verify')
  @Public()
  @Throttle({
    [THROTTLER_NAME_ADMIN_AUTH]: { limit: 5, ttl: 900000 },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify MFA challenge with TOTP code or backup code',
  })
  @ApiOkResponse({ type: AdminMfaVerifyResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired MFA code/challenge',
  })
  async verifyMfa(
    @Body() dto: AdminMfaCodeDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminMfaVerifyResponseDto> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const challengeCookie = cookies?.[this.mfaCookieName];
    const userAgent = req.headers['user-agent'];
    return this.adminMfaEnrollmentService.verifyMfa(
      dto,
      challengeCookie,
      ip,
      userAgent,
      res,
    );
  }

  @Post('logout')
  @SkipCsrf()
  @SkipThrottle({ [THROTTLER_NAME_ADMIN_AUTH]: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke current SuperAdmin session and clear session cookie',
  })
  @ApiNoContentResponse({ description: 'Admin session successfully revoked' })
  async logout(
    @CurrentAuth() auth: IAuthContext | undefined,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const userAgent = req.headers['user-agent'];
    await this.adminMfaEnrollmentService.logout(
      auth?.sessionId,
      auth?.userId,
      ip,
      userAgent,
      res,
    );
  }

  @Get('me')
  @SkipThrottle({ [THROTTLER_NAME_ADMIN_AUTH]: true })
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:access')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated SuperAdmin profile and permissions',
  })
  @ApiOkResponse({ type: AdminMeResponseDto })
  async getMe(@CurrentAuth() auth?: IAuthContext): Promise<AdminMeResponseDto> {
    return this.adminMfaEnrollmentService.getMe(auth);
  }
}

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
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { THROTTLER_NAME_AUTH } from '../../../common/constants';
import { SkipCsrf } from '../../../common/decorators';
import { Public } from '../../auth-core/decorators/public.decorator';
import { CurrentAuth } from '../../auth-core/decorators/currentAuth.decorator';
import type { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { RegistrationService } from '../services/registration.service';
import { EmailVerificationService } from '../services/emailVerification.service';
import { TenantLoginService } from '../services/tenantLogin.service';
import { PasswordResetService } from '../services/passwordReset.service';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  LoginDto,
  MfaVerifyDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GenericMessageDto,
  RedirectMessageDto,
  AuthLoginSuccessDto,
  AuthMeDto,
} from '../dto';
import {
  IGenericMessageResponse,
  IRedirectMessageResponse,
  IAuthMeResponse,
  TAuthLoginResponse,
} from '../interfaces/authResponse.interface';

@ApiTags('Auth')
@Controller('auth')
export class TenantAuthController {
  private readonly mfaCookieName: string;

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly tenantLoginService: TenantLoginService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
  ) {
    this.mfaCookieName = this.configService.get<string>(
      'cookie.mfaChallengeCookieName',
      'wv_mfa_challenge',
    );
  }

  @Post('register')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Register a new company workspace and owner account',
  })
  @ApiAcceptedResponse({ type: GenericMessageDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or free email domain used',
  })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<IGenericMessageResponse> {
    const userAgent = req.headers['user-agent'];
    return this.registrationService.register(dto, ip, userAgent);
  }

  @Post('verify-email')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email and activate workspace' })
  @ApiOkResponse({ type: RedirectMessageDto })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<IRedirectMessageResponse> {
    const userAgent = req.headers['user-agent'];
    return this.emailVerificationService.verifyEmail(dto, ip, userAgent);
  }

  @Post('resend-verification')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiAcceptedResponse({ type: GenericMessageDto })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<IGenericMessageResponse> {
    const userAgent = req.headers['user-agent'];
    return this.emailVerificationService.resendVerification(dto, ip, userAgent);
  }

  @Post('login')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate tenant user or initiate MFA challenge',
  })
  @ApiOkResponse({ type: AuthLoginSuccessDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account locked',
  })
  @ApiForbiddenResponse({
    description: 'Email not verified or account suspended',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TAuthLoginResponse> {
    const userAgent = req.headers['user-agent'];
    return this.tenantLoginService.login(dto, ip, userAgent, res);
  }

  @Post('mfa/verify')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify MFA challenge with TOTP code or backup code',
  })
  @ApiOkResponse({ type: AuthLoginSuccessDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired MFA code/challenge',
  })
  async verifyMfa(
    @Body() dto: MfaVerifyDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TAuthLoginResponse> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const challengeCookie = cookies?.[this.mfaCookieName];
    const userAgent = req.headers['user-agent'];
    return this.tenantLoginService.verifyMfa(
      dto,
      challengeCookie,
      ip,
      userAgent,
      res,
    );
  }

  @Post('logout')
  @SkipCsrf()
  @SkipThrottle({ [THROTTLER_NAME_AUTH]: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke current session and clear session cookie' })
  @ApiNoContentResponse({ description: 'Session successfully revoked' })
  async logout(
    @CurrentAuth() auth: IAuthContext | undefined,
    @Ip() ip: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const userAgent = req.headers['user-agent'];
    await this.tenantLoginService.logout(
      auth?.sessionId,
      auth?.userId,
      auth?.workspaceId ?? undefined,
      ip,
      userAgent,
      res,
    );
  }

  @Get('me')
  @SkipThrottle({ [THROTTLER_NAME_AUTH]: true })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user and workspace details',
  })
  @ApiOkResponse({ type: AuthMeDto })
  async getMe(@CurrentAuth() auth?: IAuthContext): Promise<IAuthMeResponse> {
    return this.tenantLoginService.getMe(auth);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiAcceptedResponse({ type: GenericMessageDto })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<IGenericMessageResponse> {
    const userAgent = req.headers['user-agent'];
    return this.passwordResetService.forgotPassword(dto, ip, userAgent);
  }

  @Post('reset-password')
  @Public()
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with reset token' })
  @ApiOkResponse({ type: RedirectMessageDto })
  @ApiBadRequestResponse({
    description: 'Invalid token or password policy failure',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<IRedirectMessageResponse> {
    const userAgent = req.headers['user-agent'];
    return this.passwordResetService.resetPassword(dto, ip, userAgent);
  }
}

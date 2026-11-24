import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLER_NAME_AUTH } from '../../../common/constants';
import { PERMISSIONS } from '../../rbac/constants/permissions.constants';
import { RequirePermissions } from '../../auth-core/decorators/requirePermissions.decorator';
import { CurrentAuth } from '../../auth-core/decorators/currentAuth.decorator';
import type { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { AccountSecurityService } from '../services/accountSecurity.service';
import {
  StepUpDto,
  MfaCodeDto,
  DisableMfaDto,
  ChangePasswordDto,
  MfaStatusDto,
  MfaSetupResponseDto,
  MfaBackupCodesResponseDto,
  SessionViewDto,
  RevokeOthersResponseDto,
} from '../dto';

@ApiTags('Account Security')
@ApiBearerAuth()
@Controller('account/security')
@RequirePermissions(PERMISSIONS.SECURITY_SELF)
export class TenantAccountSecurityController {
  constructor(
    private readonly accountSecurityService: AccountSecurityService,
  ) {}

  @Get('mfa')
  @ApiOperation({ summary: 'Get current 2FA status' })
  @ApiOkResponse({ type: MfaStatusDto })
  async getMfaStatus(@CurrentAuth() auth: IAuthContext): Promise<MfaStatusDto> {
    return this.accountSecurityService.getMfaStatus(auth);
  }

  @Post('mfa/setup')
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Begin 2FA setup with current password' })
  @ApiOkResponse({ type: MfaSetupResponseDto })
  async beginMfaSetup(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: StepUpDto,
  ): Promise<MfaSetupResponseDto> {
    return this.accountSecurityService.beginMfaSetup(auth, dto);
  }

  @Post('mfa/enable')
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirm and enable 2FA with verification code' })
  @ApiOkResponse({ type: MfaBackupCodesResponseDto })
  async enableMfa(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: MfaCodeDto,
  ): Promise<MfaBackupCodesResponseDto> {
    return this.accountSecurityService.enableMfa(auth, dto);
  }

  @Post('mfa/disable')
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable 2FA with password and code verification' })
  @ApiNoContentResponse({ description: '2FA successfully disabled' })
  async disableMfa(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: DisableMfaDto,
  ): Promise<void> {
    return this.accountSecurityService.disableMfa(auth, dto);
  }

  @Post('mfa/backup-codes')
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Regenerate backup recovery codes using TOTP code' })
  @ApiOkResponse({ type: MfaBackupCodesResponseDto })
  async regenerateBackupCodes(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: MfaCodeDto,
  ): Promise<MfaBackupCodesResponseDto> {
    return this.accountSecurityService.regenerateBackupCodes(auth, dto);
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'List all active sessions for current user in tenant portal',
  })
  @ApiOkResponse({ type: [SessionViewDto] })
  async listSessions(
    @CurrentAuth() auth: IAuthContext,
  ): Promise<SessionViewDto[]> {
    return this.accountSecurityService.listSessions(auth);
  }

  @Delete('sessions/:id')
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a specific active session' })
  @ApiNoContentResponse({ description: 'Session successfully revoked' })
  async revokeSession(
    @CurrentAuth() auth: IAuthContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.accountSecurityService.revokeSession(auth, id);
  }

  @Post('sessions/revoke-others')
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Revoke all other active sessions except current' })
  @ApiOkResponse({ type: RevokeOthersResponseDto })
  async revokeOtherSessions(
    @CurrentAuth() auth: IAuthContext,
  ): Promise<RevokeOthersResponseDto> {
    return this.accountSecurityService.revokeOtherSessions(auth);
  }

  @Post('password')
  @Throttle({ [THROTTLER_NAME_AUTH]: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change password and revoke other sessions' })
  @ApiNoContentResponse({ description: 'Password changed successfully' })
  async changePassword(
    @CurrentAuth() auth: IAuthContext,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.accountSecurityService.changePassword(auth, dto);
  }
}

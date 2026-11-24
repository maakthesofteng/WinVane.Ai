import { Injectable } from '@nestjs/common';
import { MfaSettingsService } from './mfaSettings.service';
import { SessionSettingsService } from './sessionSettings.service';
import { PasswordChangeService } from './passwordChange.service';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import {
  StepUpDto,
  MfaCodeDto,
  DisableMfaDto,
  ChangePasswordDto,
  MfaStatusDto,
  MfaSetupResponseDto,
  MfaBackupCodesResponseDto,
  ISessionView,
  RevokeOthersResponseDto,
} from '../dto';

@Injectable()
export class AccountSecurityService {
  constructor(
    private readonly mfaSettingsService: MfaSettingsService,
    private readonly sessionSettingsService: SessionSettingsService,
    private readonly passwordChangeService: PasswordChangeService,
  ) {}

  async getMfaStatus(auth: IAuthContext): Promise<MfaStatusDto> {
    return this.mfaSettingsService.getStatus(auth);
  }

  async beginMfaSetup(
    auth: IAuthContext,
    dto: StepUpDto,
  ): Promise<MfaSetupResponseDto> {
    return this.mfaSettingsService.beginSetup(auth, dto);
  }

  async enableMfa(
    auth: IAuthContext,
    dto: MfaCodeDto,
  ): Promise<MfaBackupCodesResponseDto> {
    return this.mfaSettingsService.enable(auth, dto);
  }

  async disableMfa(auth: IAuthContext, dto: DisableMfaDto): Promise<void> {
    return this.mfaSettingsService.disable(auth, dto);
  }

  async regenerateBackupCodes(
    auth: IAuthContext,
    dto: MfaCodeDto,
  ): Promise<MfaBackupCodesResponseDto> {
    return this.mfaSettingsService.regenerateBackupCodes(auth, dto);
  }

  async listSessions(auth: IAuthContext): Promise<ISessionView[]> {
    return this.sessionSettingsService.list(auth);
  }

  async revokeSession(auth: IAuthContext, sessionId: string): Promise<void> {
    return this.sessionSettingsService.revoke(auth, sessionId);
  }

  async revokeOtherSessions(
    auth: IAuthContext,
  ): Promise<RevokeOthersResponseDto> {
    return this.sessionSettingsService.revokeOthers(auth);
  }

  async changePassword(
    auth: IAuthContext,
    dto: ChangePasswordDto,
  ): Promise<void> {
    return this.passwordChangeService.changePassword(auth, dto);
  }
}

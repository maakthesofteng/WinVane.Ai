import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MfaService } from '../../auth-core/services/mfa.service';
import { SessionService } from '../../auth-core/services/session.service';
import { SessionRevokedReason } from '../../auth/enums/sessionRevokedReason.enum';
import { MailService } from '../../mail/mail.service';
import { StepUpService } from './stepUp.service';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import {
  StepUpDto,
  MfaCodeDto,
  DisableMfaDto,
  MfaStatusDto,
  MfaSetupResponseDto,
  MfaBackupCodesResponseDto,
} from '../dto';
import {
  mfaEnabledEmail,
  mfaDisabledEmail,
  backupCodesRegeneratedEmail,
} from '../emails';

@Injectable()
export class MfaSettingsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly stepUpService: StepUpService,
    private readonly configService: ConfigService,
  ) {}

  async getStatus(auth: IAuthContext): Promise<MfaStatusDto> {
    const status = await this.mfaService.status(auth.userId);
    return {
      enabled: status.enabled,
      confirmedAt: status.confirmedAt ? status.confirmedAt.toISOString() : null,
      backupCodesRemaining: status.backupCodesRemaining,
      canDisable: !auth.isPlatformRole,
    };
  }

  async beginSetup(
    auth: IAuthContext,
    dto: StepUpDto,
  ): Promise<MfaSetupResponseDto> {
    if (auth.isPlatformRole || auth.portal === 'admin') {
      throw new ForbiddenException({
        message: 'SuperAdmin 2FA is managed by the platform operator.',
        code: ERROR_CODES.MFA_MANAGED_BY_OPERATOR,
      });
    }

    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: auth.userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const currentStatus = await this.mfaService.status(auth.userId);
    if (currentStatus.enabled) {
      throw new ConflictException({
        message: 'MFA is already enabled on this account.',
        code: ERROR_CODES.MFA_ALREADY_ENABLED,
      });
    }

    await this.stepUpService.assertCurrentPassword(user, dto.currentPassword);
    const { otpauthUrl, secret } = await this.mfaService.beginSetup(
      user.id,
      user.email,
    );

    return { otpauthUrl, secret };
  }

  async enable(
    auth: IAuthContext,
    dto: MfaCodeDto,
  ): Promise<MfaBackupCodesResponseDto> {
    if (auth.isPlatformRole || auth.portal === 'admin') {
      throw new ForbiddenException({
        message: 'SuperAdmin 2FA is managed by the platform operator.',
        code: ERROR_CODES.MFA_MANAGED_BY_OPERATOR,
      });
    }

    const { backupCodes } = await this.mfaService.confirmSetup(
      auth.userId,
      dto.code,
    );

    const emailContent = await mfaEnabledEmail({ fullName: auth.fullName });
    await this.mailService.enqueue({
      to: auth.email,
      ...emailContent,
    });

    return { backupCodes };
  }

  async disable(auth: IAuthContext, dto: DisableMfaDto): Promise<void> {
    if (auth.isPlatformRole || auth.portal === 'admin') {
      throw new ForbiddenException({
        message: '2FA is mandatory for SuperAdmin.',
        code: ERROR_CODES.MFA_REQUIRED_FOR_ROLE,
      });
    }

    const status = await this.mfaService.status(auth.userId);
    if (!status.enabled) {
      throw new BadRequestException({
        message: 'MFA is not enabled on this account.',
        code: ERROR_CODES.MFA_NOT_ENABLED,
      });
    }

    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: auth.userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.stepUpService.assertCurrentPassword(user, dto.currentPassword);
    await this.mfaService.verify(auth.userId, dto.code);
    await this.mfaService.disable(auth.userId);

    // Revoke caller's other sessions (keep the current one)
    await this.sessionService.revokeAllForUser(
      auth.userId,
      SessionRevokedReason.REVOKED_BY_USER,
      { exceptSessionId: auth.sessionId },
    );

    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      '';
    const resetPasswordUrl = `${frontendUrl}/forgot-password`;

    const emailContent = await mfaDisabledEmail({
      fullName: auth.fullName,
      resetPasswordUrl,
    });
    await this.mailService.enqueue({
      to: auth.email,
      ...emailContent,
    });
  }

  async regenerateBackupCodes(
    auth: IAuthContext,
    dto: MfaCodeDto,
  ): Promise<MfaBackupCodesResponseDto> {
    const status = await this.mfaService.status(auth.userId);
    if (!status.enabled) {
      throw new BadRequestException({
        message: 'MFA is not enabled on this account.',
        code: ERROR_CODES.MFA_NOT_ENABLED,
      });
    }

    const cleanCode = (dto.code || '').trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      throw new BadRequestException({
        message: 'A 6-digit TOTP code is required to regenerate backup codes.',
        code: ERROR_CODES.MFA_INVALID,
      });
    }

    const verifyResult = await this.mfaService.verify(auth.userId, cleanCode);
    if (verifyResult.method !== 'totp') {
      throw new BadRequestException({
        message: 'A valid TOTP code is required to regenerate backup codes.',
        code: ERROR_CODES.MFA_INVALID,
      });
    }

    const backupCodes = await this.mfaService.regenerateBackupCodes(
      auth.userId,
    );

    const emailContent = await backupCodesRegeneratedEmail({
      fullName: auth.fullName,
    });
    await this.mailService.enqueue({
      to: auth.email,
      ...emailContent,
    });

    return { backupCodes };
  }
}

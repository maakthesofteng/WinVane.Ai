import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { NobleCryptoPlugin, ScureBase32Plugin, TOTP } from 'otplib';
import { randomBytes } from 'crypto';
import {
  MfaDevice,
  IBackupCodeItem,
} from '../../auth/entities/mfaDevice.entity';
import { User } from '../../users/entities/user.entity';
import { CryptoService } from './crypto.service';
import { TokenService } from './token.service';
import { AuthContextService } from './authContext.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

const BACKUP_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

@Injectable()
export class MfaService {
  private readonly totp: TOTP;
  private readonly issuer: string;

  constructor(
    @InjectRepository(MfaDevice)
    private readonly mfaDeviceRepository: Repository<MfaDevice>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
    private readonly tokenService: TokenService,
    private readonly authContextService: AuthContextService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.totp = new TOTP({
      algorithm: 'sha1',
      digits: 6,
      period: 30,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    this.issuer = this.configService.get<string>('mfa.issuer', 'WinVane.ai');
  }

  async beginSetup(
    userId: string,
    email: string,
  ): Promise<{ otpauthUrl: string; secret: string }> {
    const existing = await this.mfaDeviceRepository.findOne({
      where: { userId },
    });
    if (existing?.enabled) {
      throw new ConflictException('MFA is already enabled on this account.');
    }

    const secret = this.totp.generateSecret();
    const secretEncrypted = this.cryptoService.encrypt(secret);

    if (existing) {
      existing.secretEncrypted = secretEncrypted;
      existing.enabled = false;
      existing.confirmedAt = null;
      existing.lastUsedStep = null;
      existing.backupCodes = [];
      await this.mfaDeviceRepository.save(existing);
    } else {
      const device = this.mfaDeviceRepository.create({
        userId,
        secretEncrypted,
        enabled: false,
        backupCodes: [],
      });
      await this.mfaDeviceRepository.save(device);
    }

    const otpauthUrl = this.totp.toURI({
      label: `WinVane.ai:${email}`,
      issuer: this.issuer,
      secret,
    });

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_MFA_SETUP_STARTED,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
    });

    return { otpauthUrl, secret };
  }

  async confirmSetup(
    userId: string,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    const device = await this.mfaDeviceRepository
      .createQueryBuilder('device')
      .addSelect('device.secretEncrypted')
      .where('device.user_id = :userId', { userId })
      .getOne();

    if (!device) {
      throw new NotFoundException('No pending MFA setup found.');
    }

    const secret = this.cryptoService.decrypt(device.secretEncrypted);
    const cleanCode = (code || '').trim();

    const verifyResult = await this.totp.verify(cleanCode, {
      secret,
      epochTolerance: 30,
    });

    if (!verifyResult.valid) {
      throw new BadRequestException({
        message: 'Invalid verification code.',
        code: ERROR_CODES.MFA_INVALID,
      });
    }

    const rawBackupCodes = this.generateBackupCodesList(10);
    const hashedBackupCodes: IBackupCodeItem[] = rawBackupCodes.map((c) => ({
      hash: this.tokenService.hash(c.replace('-', '').toUpperCase()),
      usedAt: null,
    }));

    device.enabled = true;
    device.confirmedAt = new Date();
    device.lastUsedStep = String(verifyResult.timeStep);
    device.backupCodes = hashedBackupCodes;
    await this.mfaDeviceRepository.save(device);

    await this.userRepository.update({ id: userId }, { mfaEnabled: true });
    await this.authContextService.invalidate(userId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_MFA_ENABLED,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
    });

    return { backupCodes: rawBackupCodes };
  }

  async verify(
    userId: string,
    code: string,
  ): Promise<{
    method: 'totp' | 'backup_code';
    backupCodesRemaining?: number;
  }> {
    const device = await this.mfaDeviceRepository
      .createQueryBuilder('device')
      .addSelect('device.secretEncrypted')
      .addSelect('device.backupCodes')
      .where('device.user_id = :userId AND device.enabled = true', { userId })
      .getOne();

    if (!device) {
      throw new UnauthorizedException({
        message: 'MFA device not found or not enabled.',
        code: ERROR_CODES.MFA_INVALID,
      });
    }

    const cleanCode = (code || '').trim();

    if (/^\d{6}$/.test(cleanCode)) {
      const secret = this.cryptoService.decrypt(device.secretEncrypted);
      const afterTimeStep = device.lastUsedStep
        ? Number(device.lastUsedStep)
        : undefined;

      const result = await this.totp.verify(cleanCode, {
        secret,
        epochTolerance: 30,
        afterTimeStep,
      });

      if (!result.valid) {
        throw new UnauthorizedException({
          message: 'Invalid or expired MFA code.',
          code: ERROR_CODES.MFA_INVALID,
        });
      }

      device.lastUsedStep = String(result.timeStep);
      await this.mfaDeviceRepository.save(device);

      return { method: 'totp' };
    }

    const normalizedCode = cleanCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const codeHash = this.tokenService.hash(normalizedCode);

    const backupCodes = device.backupCodes || [];
    const matchedItem = backupCodes.find(
      (item) => item.hash === codeHash && !item.usedAt,
    );

    if (!matchedItem) {
      throw new UnauthorizedException({
        message: 'Invalid MFA verification code or backup code.',
        code: ERROR_CODES.MFA_INVALID,
      });
    }

    matchedItem.usedAt = new Date().toISOString();
    device.backupCodes = backupCodes;
    await this.mfaDeviceRepository.save(device);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_MFA_BACKUP_CODE_USED,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
    });

    const backupCodesRemaining = backupCodes.filter(
      (item) => !item.usedAt,
    ).length;
    return { method: 'backup_code', backupCodesRemaining };
  }

  async disable(userId: string): Promise<void> {
    await this.mfaDeviceRepository.delete({ userId });
    await this.userRepository.update({ id: userId }, { mfaEnabled: false });
    await this.authContextService.invalidate(userId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_MFA_DISABLED,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
    });
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const device = await this.mfaDeviceRepository.findOne({
      where: { userId, enabled: true },
    });
    if (!device) {
      throw new NotFoundException('Active MFA device not found.');
    }

    const rawCodes = this.generateBackupCodesList(10);
    device.backupCodes = rawCodes.map((c) => ({
      hash: this.tokenService.hash(c.replace('-', '').toUpperCase()),
      usedAt: null,
    }));
    await this.mfaDeviceRepository.save(device);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_MFA_BACKUP_CODES_REGENERATED,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
    });

    return rawCodes;
  }

  async status(userId: string): Promise<{
    enabled: boolean;
    confirmedAt: Date | null;
    backupCodesRemaining: number;
  }> {
    const device = await this.mfaDeviceRepository
      .createQueryBuilder('device')
      .addSelect('device.backupCodes')
      .where('device.user_id = :userId', { userId })
      .getOne();

    if (!device || !device.enabled) {
      return { enabled: false, confirmedAt: null, backupCodesRemaining: 0 };
    }

    const remaining = (device.backupCodes || []).filter(
      (b) => !b.usedAt,
    ).length;

    return {
      enabled: true,
      confirmedAt: device.confirmedAt,
      backupCodesRemaining: remaining,
    };
  }

  private generateBackupCodesList(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let code = '';
      const bytes = randomBytes(8);
      for (let j = 0; j < 8; j++) {
        code += BACKUP_CODE_ALPHABET[bytes[j] % BACKUP_CODE_ALPHABET.length];
      }
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }
}

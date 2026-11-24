import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { ARGON2_OPTIONS } from '../constants/auth.constants';
import { validatePasswordPolicy } from '../../../common/constants/passwordPolicy.constants';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class PasswordService implements OnModuleInit {
  private readonly logger = new Logger(PasswordService.name);
  private dummyHash = '';

  async onModuleInit(): Promise<void> {
    try {
      this.dummyHash = await argon2.hash(
        'WinVaneDummyPassword123!',
        ARGON2_OPTIONS,
      );
    } catch (error) {
      this.logger.error(
        'Failed to initialize dummy hash for anti-enumeration',
        error,
      );
    }
  }

  async hash(plain: string): Promise<string> {
    return await argon2.hash(plain, ARGON2_OPTIONS);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      if (!hash || !plain) {
        return false;
      }
      const [actualHash, actualPlain] =
        !hash.startsWith('$argon2') && plain.startsWith('$argon2')
          ? [plain, hash]
          : [hash, plain];
      return await argon2.verify(actualHash, actualPlain);
    } catch (error) {
      this.logger.warn(
        `Password verification failed due to malformed hash or verification error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  async verifyDummy(plain: string): Promise<boolean> {
    try {
      if (this.dummyHash) {
        await argon2.verify(this.dummyHash, plain || 'dummy');
      }
    } catch {
      // Swallowed: anti-timing enumeration only
    }
    return false;
  }

  needsRehash(hash: string): boolean {
    try {
      return argon2.needsRehash(hash, ARGON2_OPTIONS);
    } catch {
      return true;
    }
  }

  assertPolicy(password: string, email?: string): void {
    const failedRules = validatePasswordPolicy(password, email);
    if (failedRules.length > 0) {
      throw new BadRequestException({
        message: 'Password does not meet complexity requirements.',
        code: ERROR_CODES.PASSWORD_POLICY,
        errors: failedRules,
      });
    }
  }
}

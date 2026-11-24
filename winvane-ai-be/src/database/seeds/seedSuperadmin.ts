import * as argon2 from 'argon2';
import { IsNull } from 'typeorm';
import appDataSource from '../dataSource';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/rbac/entities/role.entity';
import { Session } from '../../modules/auth/entities/session.entity';
import { MfaDevice } from '../../modules/auth/entities/mfaDevice.entity';
import { AuditLog } from '../../modules/audit/entities/auditLog.entity';
import { ROLE_NAMES } from '../../modules/rbac/constants';
import { validatePasswordPolicy } from '../../common/constants/passwordPolicy.constants';
import { UserStatus } from '../../modules/users/enums/userStatus.enum';
import { SessionRevokedReason } from '../../modules/auth/enums/sessionRevokedReason.enum';
import { AUDIT_ACTIONS } from '../../modules/audit/constants/auditActions.constants';
import { AuditResult } from '../../modules/audit/enums/auditResult.enum';

interface ISeedSuperadminOptions {
  reset?: boolean;
  resetMfa?: boolean;
  confirm?: boolean;
}

export async function seedSuperadmin(
  options: ISeedSuperadminOptions = {},
): Promise<void> {
  const isReset = options.reset ?? process.argv.includes('--reset');
  const isResetMfa = options.resetMfa ?? process.argv.includes('--reset-mfa');
  const isConfirm = options.confirm ?? process.argv.includes('--confirm');

  if (process.env.NODE_ENV === 'production' && !isConfirm) {
    throw new Error(
      'In production, --confirm flag is required to run seed:superadmin.',
    );
  }

  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const fullName = process.env.SUPERADMIN_FULL_NAME?.trim();

  if (!email) {
    throw new Error('SUPERADMIN_EMAIL environment variable is required.');
  }

  if ((!isResetMfa || isReset) && !password) {
    throw new Error('SUPERADMIN_PASSWORD environment variable is required.');
  }

  if (!isReset && !isResetMfa && !fullName) {
    throw new Error('SUPERADMIN_FULL_NAME environment variable is required.');
  }

  if (password) {
    const policyErrors = validatePasswordPolicy(password, email);
    if (policyErrors.length > 0) {
      throw new Error(
        `SUPERADMIN_PASSWORD violates password policy:\n - ${policyErrors.join('\n - ')}`,
      );
    }
  }

  const initialized = appDataSource.isInitialized;
  if (!initialized) {
    await appDataSource.initialize();
  }

  try {
    await appDataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const userRepo = manager.getRepository(User);
      const sessionRepo = manager.getRepository(Session);
      const mfaRepo = manager.getRepository(MfaDevice);
      const auditRepo = manager.getRepository(AuditLog);

      const superAdminRole = await roleRepo.findOne({
        where: { name: ROLE_NAMES.SUPER_ADMIN },
      });
      if (!superAdminRole) {
        throw new Error(
          'SuperAdmin role does not exist. Please run seed:roles first.',
        );
      }

      const existingSuperAdmin = await userRepo.findOne({
        where: { roleId: superAdminRole.id },
      });

      // Default mode: create new SuperAdmin
      if (!isReset && !isResetMfa) {
        if (existingSuperAdmin) {
          throw new Error(
            'A SuperAdmin already exists. Use --reset to change password or --reset-mfa to reset 2FA.',
          );
        }

        const emailInUse = await userRepo.findOne({ where: { email } });
        if (emailInUse) {
          throw new Error(
            `A user with email '${email}' already exists with a different role.`,
          );
        }

        const passwordHash = await argon2.hash(password!, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        });

        const newSuperAdmin = userRepo.create({
          email,
          passwordHash,
          fullName: fullName!,
          roleId: superAdminRole.id,
          workspaceId: null,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          mfaEnabled: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        });

        const savedUser = await userRepo.save(newSuperAdmin);

        await auditRepo.save(
          auditRepo.create({
            actorUserId: null,
            workspaceId: null,
            action: AUDIT_ACTIONS.SUPERADMIN_SEEDED,
            result: AuditResult.SUCCESS,
            targetType: 'user',
            targetId: savedUser.id,
            metadata: { email: savedUser.email },
          }),
        );

        process.stdout.write(
          `[SeedSuperadmin] Created SuperAdmin successfully: ${savedUser.email}\n`,
        );
        return;
      }

      // Reset / Reset MFA modes
      if (!existingSuperAdmin) {
        throw new Error(
          'No existing SuperAdmin found to reset. Run without --reset to create one.',
        );
      }

      if (existingSuperAdmin.email !== email) {
        throw new Error(
          `Existing SuperAdmin email (${existingSuperAdmin.email}) does not match SUPERADMIN_EMAIL (${email}). Only one SuperAdmin is permitted.`,
        );
      }

      if (isReset) {
        const passwordHash = await argon2.hash(password!, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        });

        existingSuperAdmin.passwordHash = passwordHash;
        existingSuperAdmin.passwordChangedAt = new Date();
        existingSuperAdmin.failedLoginAttempts = 0;
        existingSuperAdmin.lockedUntil = null;
        if (fullName) {
          existingSuperAdmin.fullName = fullName;
        }

        await sessionRepo.update(
          { userId: existingSuperAdmin.id, revokedAt: IsNull() },
          {
            revokedAt: new Date(),
            revokedReason: SessionRevokedReason.SUPERADMIN_RESET,
          },
        );

        await auditRepo.save(
          auditRepo.create({
            actorUserId: null,
            workspaceId: null,
            action: AUDIT_ACTIONS.SUPERADMIN_RESET,
            result: AuditResult.SUCCESS,
            targetType: 'user',
            targetId: existingSuperAdmin.id,
            metadata: { email: existingSuperAdmin.email },
          }),
        );

        process.stdout.write(
          `[SeedSuperadmin] Password reset and sessions revoked for: ${existingSuperAdmin.email}\n`,
        );
      }

      if (isResetMfa) {
        await mfaRepo.delete({ userId: existingSuperAdmin.id });
        existingSuperAdmin.mfaEnabled = false;

        await sessionRepo.update(
          { userId: existingSuperAdmin.id, revokedAt: IsNull() },
          {
            revokedAt: new Date(),
            revokedReason: SessionRevokedReason.MFA_RESET,
          },
        );

        await auditRepo.save(
          auditRepo.create({
            actorUserId: null,
            workspaceId: null,
            action: AUDIT_ACTIONS.SUPERADMIN_MFA_RESET,
            result: AuditResult.SUCCESS,
            targetType: 'user',
            targetId: existingSuperAdmin.id,
            metadata: { email: existingSuperAdmin.email },
          }),
        );

        process.stdout.write(
          `[SeedSuperadmin] MFA device deleted and sessions revoked for: ${existingSuperAdmin.email}\n`,
        );
      }

      await userRepo.save(existingSuperAdmin);
    });
  } finally {
    if (!initialized) {
      await appDataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedSuperadmin()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[SeedSuperadmin Error] ${msg}\n`);
      process.exit(1);
    });
}

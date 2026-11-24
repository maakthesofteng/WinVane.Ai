import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';
import { AuditLogModule } from '../audit/auditLog.module';
import { RbacModule } from '../rbac/rbac.module';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { Role } from '../rbac/entities/role.entity';
import { DomainVerificationToken } from './entities/domainVerificationToken.entity';
import { PasswordResetToken } from './entities/passwordResetToken.entity';
import { MfaDevice } from './entities/mfaDevice.entity';
import { Session } from './entities/session.entity';
import { FreeEmailDomainService } from './services/freeEmailDomain.service';
import { RegistrationService } from './services/registration.service';
import { EmailVerificationService } from './services/emailVerification.service';
import { TenantLoginService } from './services/tenantLogin.service';
import { PasswordResetService } from './services/passwordReset.service';
import { AuthCleanupJob } from './jobs/authCleanup.job';
import { TenantAuthController } from './controllers/tenantAuth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Workspace,
      Role,
      DomainVerificationToken,
      PasswordResetToken,
      MfaDevice,
      Session,
    ]),
    MailModule,
    RedisModule,
    AuditLogModule,
    RbacModule,
  ],
  controllers: [TenantAuthController],
  providers: [
    FreeEmailDomainService,
    RegistrationService,
    EmailVerificationService,
    TenantLoginService,
    PasswordResetService,
    AuthCleanupJob,
  ],
  exports: [
    FreeEmailDomainService,
    RegistrationService,
    EmailVerificationService,
    TenantLoginService,
    PasswordResetService,
  ],
})
export class AuthModule {}

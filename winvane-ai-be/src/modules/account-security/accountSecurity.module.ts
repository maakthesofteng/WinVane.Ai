import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { MfaDevice } from '../auth/entities/mfaDevice.entity';
import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';
import { AuditLogModule } from '../audit/auditLog.module';
import { TenantAccountSecurityController } from './controllers/tenantAccountSecurity.controller';
import { AdminAccountSecurityController } from './controllers/adminAccountSecurity.controller';
import {
  StepUpService,
  MfaSettingsService,
  SessionSettingsService,
  PasswordChangeService,
  AccountSecurityService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, MfaDevice]),
    MailModule,
    RedisModule,
    AuditLogModule,
  ],
  controllers: [
    TenantAccountSecurityController,
    AdminAccountSecurityController,
  ],
  providers: [
    StepUpService,
    MfaSettingsService,
    SessionSettingsService,
    PasswordChangeService,
    AccountSecurityService,
  ],
  exports: [
    AccountSecurityService,
    StepUpService,
    MfaSettingsService,
    SessionSettingsService,
    PasswordChangeService,
  ],
})
export class AccountSecurityModule {}

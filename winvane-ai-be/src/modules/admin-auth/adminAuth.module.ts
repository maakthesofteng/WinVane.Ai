import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { AuditLogModule } from '../audit/auditLog.module';
import { RedisModule } from '../redis/redis.module';
import { User } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Session } from '../auth/entities/session.entity';
import { MfaDevice } from '../auth/entities/mfaDevice.entity';
import { RolePermission } from '../rbac/entities/rolePermission.entity';
import { AdminAuthController } from './controllers/adminAuth.controller';
import { AdminLoginService } from './services/adminLogin.service';
import { AdminMfaEnrollmentService } from './services/adminMfaEnrollment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Session, MfaDevice, RolePermission]),
    MailModule,
    AuditLogModule,
    RedisModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminLoginService, AdminMfaEnrollmentService],
  exports: [AdminLoginService, AdminMfaEnrollmentService],
})
export class AdminAuthModule {}

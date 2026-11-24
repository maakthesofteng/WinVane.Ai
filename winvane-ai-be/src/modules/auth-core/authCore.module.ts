import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../auth/entities/session.entity';
import { DomainVerificationToken } from '../auth/entities/domainVerificationToken.entity';
import { PasswordResetToken } from '../auth/entities/passwordResetToken.entity';
import { MfaDevice } from '../auth/entities/mfaDevice.entity';
import { User } from '../users/entities/user.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { CryptoService } from './services/crypto.service';
import { SessionService } from './services/session.service';
import { SessionCookieService } from './services/sessionCookie.service';
import { AuthContextService } from './services/authContext.service';
import { LoginAttemptService } from './services/loginAttempt.service';
import { MfaService } from './services/mfa.service';
import { MfaChallengeService } from './services/mfaChallenge.service';
import { TenantJwtStrategy } from './strategies/tenantJwt.strategy';
import { AdminJwtStrategy } from './strategies/adminJwt.strategy';
import { SessionAuthGuard } from './guards/sessionAuth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthCoreTestController } from './testing/authCoreTest.controller';

const isTestEnv = process.env.NODE_ENV === 'test';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      DomainVerificationToken,
      PasswordResetToken,
      MfaDevice,
      User,
      Permission,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt-tenant' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret', 'default_secret'),
        signOptions: {
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  controllers: isTestEnv ? [AuthCoreTestController] : [],
  providers: [
    PasswordService,
    TokenService,
    CryptoService,
    SessionService,
    SessionCookieService,
    AuthContextService,
    LoginAttemptService,
    MfaService,
    MfaChallengeService,
    TenantJwtStrategy,
    AdminJwtStrategy,
    SessionAuthGuard,
    PermissionsGuard,
  ],
  exports: [
    TypeOrmModule,
    JwtModule,
    PassportModule,
    PasswordService,
    TokenService,
    CryptoService,
    SessionService,
    SessionCookieService,
    AuthContextService,
    LoginAttemptService,
    MfaService,
    MfaChallengeService,
    SessionAuthGuard,
    PermissionsGuard,
  ],
})
export class AuthCoreModule {}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import configuration from './config/configuration';
import { validateEnv } from './config/env.schema';
import {
  REDIS_CLIENT,
  REQUEST_ID_HEADER,
  THROTTLER_NAME_ADMIN_AUTH,
  THROTTLER_NAME_AUTH,
  THROTTLER_NAME_DEFAULT,
} from './common/constants';
import { HttpExceptionFilter } from './common/filters/httpException.filter';
import { RequestIdMiddleware } from './common/middleware/requestId.middleware';
import { DatabaseModule } from './database/database.module';
import { AuditLogModule } from './modules/audit/auditLog.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthCoreModule } from './modules/auth-core/authCore.module';
import { AdminAuthModule } from './modules/admin-auth/adminAuth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AccountSecurityModule } from './modules/account-security/accountSecurity.module';
import { SessionAuthGuard } from './modules/auth-core/guards/sessionAuth.guard';
import { PermissionsGuard } from './modules/auth-core/guards/permissions.guard';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { QueueModule } from './modules/queue/queue.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { RedisModule } from './modules/redis/redis.module';
import { SecurityModule } from './modules/security/security.module';
import { CsrfGuard } from './modules/security/csrf.guard';
import { UsersModule } from './modules/users/users.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { TeamsModule } from './modules/teams/teams.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { MembersModule } from './modules/members/members.module';
import { CompanyBrainModule } from './modules/company-brain/companyBrain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('app.nodeEnv') === 'production';

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:standard',
                  },
                },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                'req.body.password',
                'req.body.newPassword',
                'req.body.token',
                'req.body.code',
                'req.body.secret',
              ],
              censor: '[REDACTED]',
            },
            genReqId: (req) =>
              (req.headers[REQUEST_ID_HEADER] as string) ||
              (req as { id?: string }).id ||
              randomUUID(),
            customProps: (req) => ({
              requestId:
                (req.headers[REQUEST_ID_HEADER] as string) ||
                (req as { id?: string }).id ||
                randomUUID(),
            }),
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      inject: [ConfigService, REDIS_CLIENT],
      useFactory: (configService: ConfigService, redisClient: Redis) => ({
        throttlers: [
          {
            name: THROTTLER_NAME_DEFAULT,
            ttl: seconds(configService.get<number>('throttle.ttlSeconds', 60)),
            limit: configService.get<number>('throttle.limit', 100),
          },
          {
            name: THROTTLER_NAME_AUTH,
            ttl: seconds(60),
            limit: configService.get<number>('throttle.authLimit', 5),
            skipIf: (context) => {
              const handler = context.getHandler();
              const classRef = context.getClass();
              const hasAuthThrottle =
                Boolean(
                  handler &&
                  Reflect.getMetadata(
                    `THROTTLER:LIMIT${THROTTLER_NAME_AUTH}`,
                    handler,
                  ),
                ) ||
                Boolean(
                  classRef &&
                  Reflect.getMetadata(
                    `THROTTLER:LIMIT${THROTTLER_NAME_AUTH}`,
                    classRef,
                  ),
                );
              return !hasAuthThrottle;
            },
          },
          {
            name: THROTTLER_NAME_ADMIN_AUTH,
            ttl: seconds(
              configService.get<number>('throttle.adminAuthTtlSeconds', 60),
            ),
            limit: configService.get<number>('throttle.adminAuthLimit', 5),
            skipIf: (context) => {
              const handler = context.getHandler();
              const classRef = context.getClass();
              const hasAdminAuthThrottle =
                Boolean(
                  handler &&
                  Reflect.getMetadata(
                    `THROTTLER:LIMIT${THROTTLER_NAME_ADMIN_AUTH}`,
                    handler,
                  ),
                ) ||
                Boolean(
                  classRef &&
                  Reflect.getMetadata(
                    `THROTTLER:LIMIT${THROTTLER_NAME_ADMIN_AUTH}`,
                    classRef,
                  ),
                );
              return !hasAdminAuthThrottle;
            },
          },
        ],
        storage: new ThrottlerStorageRedisService(redisClient),
      }),
    }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    MailModule,
    WorkspaceModule,
    UsersModule,
    RbacModule,
    TeamsModule,
    InvitationsModule,
    MembersModule,
    CompanyBrainModule,
    AuthCoreModule,
    AuthModule,
    AdminAuthModule,
    AdminModule,
    AccountSecurityModule,
    AuditLogModule,
    SecurityModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

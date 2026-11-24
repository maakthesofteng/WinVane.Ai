import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Express } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Create app with buffered logs and attach Pino logger
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  const configService = app.get(ConfigService);
  const isProduction =
    configService.get<string>('app.nodeEnv') === 'production';
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');

  // 2. Global prefix
  app.setGlobalPrefix(apiPrefix);

  // 3. Helmet security baseline
  app.use(
    helmet({
      frameguard: { action: 'deny' },
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
    }),
  );

  // 4. Cookie parser
  app.use(cookieParser());

  // 5. CORS with credentials and configured origins
  const corsOrigins = configService.getOrThrow<string[]>('app.corsOrigins');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-csrf-token',
      'x-request-id',
    ],
    exposedHeaders: ['X-Request-Id'],
  });

  // 6. Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 8. Swagger at /api/docs only in non-production
  if (!isProduction) {
    const sessionCookieName = configService.get<string>(
      'cookie.sessionCookieName',
      'wv_session',
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle('WinVane.ai API')
      .setDescription('WinVane.ai B2B AI Lead Discovery Platform API')
      .setVersion('1.0')
      .addCookieAuth(
        sessionCookieName,
        {
          type: 'apiKey',
          in: 'cookie',
          name: sessionCookieName,
          description: 'Session authentication cookie',
        },
        'session-cookie',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // 9. Shutdown hooks
  app.enableShutdownHooks();

  // 10. Trust proxy for rate limiting behind reverse proxies
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  expressApp.set('trust proxy', 1);

  const port = configService.get<number>('app.port', 5173);
  await app.listen(port);
  pinoLogger.log(
    `Application listening on port ${port} with prefix /${apiPrefix}`,
  );
}

void bootstrap();

import { TEnv } from './env.schema';

export type TAppConfig = {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiPrefix: string;
  backendUrl: string;
  frontendUrl: string;
  corsOrigins: string[];
};

export type TDatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  ssl: boolean;
};

export type TRedisConfig = {
  host: string;
  port: number;
  password?: string;
};

export type TJwtConfig = {
  secret: string;
  sessionTtlHours: number;
  adminSessionTtlHours: number;
  adminSessionIdleMinutes: number;
  sessionCacheTtlSeconds: number;
  dataEncryptionKey: string;
};

export type TCookieConfig = {
  sessionCookieName: string;
  adminSessionCookieName: string;
  mfaChallengeCookieName: string;
  mfaChallengeTtlSeconds: number;
  domain: string;
  secure: boolean;
};

export type TMfaConfig = {
  challengeMaxAttempts: number;
  issuer: string;
};

export type TCsrfConfig = {
  secret: string;
  cookieName: string;
};

export type TThrottleConfig = {
  ttlSeconds: number;
  limit: number;
  authLimit: number;
  adminAuthLimit: number;
  adminAuthTtlSeconds: number;
  lockoutMaxAttempts: number;
  lockoutMinutes: number;
  adminLockoutMinutes: number;
};

export type TMailConfig = {
  provider: 'smtp' | 'ethereal';
  from: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  testTo: string;
};

export type TRootConfig = {
  app: TAppConfig;
  db: TDatabaseConfig;
  redis: TRedisConfig;
  jwt: TJwtConfig;
  cookie: TCookieConfig;
  mfa: TMfaConfig;
  csrf: TCsrfConfig;
  throttle: TThrottleConfig;
  mail: TMailConfig;
};

export const configuration = (): TRootConfig => {
  const env = process.env as unknown as TEnv;

  return {
    app: {
      nodeEnv: env.NODE_ENV ?? 'development',
      port: Number(env.PORT ?? 5173),
      apiPrefix: env.API_PREFIX ?? 'api/v1',
      backendUrl: env.BACKEND_URL || '',
      frontendUrl: env.FRONTEND_URL,
      corsOrigins: (env.CORS_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
    db: {
      host: env.DB_HOST ?? 'localhost',
      port: Number(env.DB_PORT ?? 5432),
      user: env.DB_USER ?? 'winvane',
      password: env.DB_PASSWORD ?? 'change_me',
      name: env.DB_NAME ?? 'winvane',
      ssl: String(env.DB_SSL) === 'true',
    },
    redis: {
      host: env.REDIS_HOST ?? 'localhost',
      port: Number(env.REDIS_PORT ?? 6379),
      password: env.REDIS_PASSWORD || undefined,
    },
    jwt: {
      secret: env.JWT_SECRET,
      sessionTtlHours: Number(env.SESSION_TTL_HOURS ?? 24),
      adminSessionTtlHours: Number(env.ADMIN_SESSION_TTL_HOURS ?? 8),
      adminSessionIdleMinutes: Number(env.ADMIN_SESSION_IDLE_MINUTES ?? 30),
      sessionCacheTtlSeconds: Number(env.SESSION_CACHE_TTL_SECONDS ?? 300),
      dataEncryptionKey: env.DATA_ENCRYPTION_KEY,
    },
    cookie: {
      sessionCookieName: env.SESSION_COOKIE_NAME ?? 'wv_session',
      adminSessionCookieName:
        env.ADMIN_SESSION_COOKIE_NAME ?? 'wv_admin_session',
      mfaChallengeCookieName:
        env.MFA_CHALLENGE_COOKIE_NAME ?? 'wv_mfa_challenge',
      mfaChallengeTtlSeconds: Number(env.MFA_CHALLENGE_TTL_SECONDS ?? 300),
      domain: env.COOKIE_DOMAIN ?? 'localhost',
      secure: String(env.COOKIE_SECURE) === 'true',
    },
    mfa: {
      challengeMaxAttempts: Number(env.MFA_CHALLENGE_MAX_ATTEMPTS ?? 5),
      issuer: env.MFA_ISSUER ?? 'WinVane.ai',
    },
    csrf: {
      secret: env.CSRF_SECRET,
      cookieName: env.CSRF_COOKIE_NAME ?? 'wv_csrf',
    },
    throttle: {
      ttlSeconds: Number(env.THROTTLE_TTL_SECONDS ?? 60),
      limit: Number(env.THROTTLE_LIMIT ?? 100),
      authLimit: Number(env.AUTH_THROTTLE_LIMIT ?? 5),
      adminAuthLimit: Number(env.ADMIN_AUTH_THROTTLE_LIMIT ?? 5),
      adminAuthTtlSeconds: Number(env.ADMIN_AUTH_THROTTLE_TTL_SECONDS ?? 900),
      lockoutMaxAttempts: Number(env.LOGIN_LOCKOUT_MAX_ATTEMPTS ?? 5),
      lockoutMinutes: Number(env.LOGIN_LOCKOUT_MINUTES ?? 15),
      adminLockoutMinutes: Number(env.ADMIN_LOCKOUT_MINUTES ?? 30),
    },
    mail: {
      provider: env.MAIL_PROVIDER ?? 'smtp',
      from: env.MAIL_FROM ?? 'WinVane.ai <no-reply@winvane.ai>',
      smtpHost:
        env.SMTP_HOST === 'localhost'
          ? '127.0.0.1'
          : (env.SMTP_HOST ?? '127.0.0.1'),
      smtpPort: Number(env.SMTP_PORT ?? 1025),
      smtpSecure: String(env.SMTP_SECURE) === 'true',
      smtpUser: env.SMTP_USER || undefined,
      smtpPassword: env.SMTP_PASSWORD || undefined,
      testTo: env.MAIL_TEST_TO ?? 'dev@example.com',
    },
  };
};

export default configuration;

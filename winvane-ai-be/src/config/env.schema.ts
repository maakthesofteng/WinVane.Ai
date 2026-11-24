import { z } from 'zod';

export const envSchema = z
  .object({
    // App
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(5173),
    API_PREFIX: z.string().default('api/v1'),
    BACKEND_URL: z.string().url().optional(),
    FRONTEND_URL: z
      .string()
      .url('FRONTEND_URL is required in .env and must be a valid URL'),
    CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS is required in .env'),

    // Database
    DB_HOST: z.string().min(1).default('localhost'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USER: z.string().min(1).default('winvane'),
    DB_PASSWORD: z.string().default('change_me'),
    DB_NAME: z.string().min(1).default('winvane'),
    DB_SSL: z
      .string()
      .or(z.boolean())
      .transform((val) => val === true || val === 'true')
      .default(false),

    // Redis
    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional().default(''),

    // JWT / session
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24),
    SESSION_COOKIE_NAME: z.string().min(1).default('wv_session'),
    ADMIN_SESSION_COOKIE_NAME: z.string().min(1).default('wv_admin_session'),
    ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(8),
    ADMIN_SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(30),
    SESSION_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    COOKIE_DOMAIN: z.string().default('localhost'),
    COOKIE_SECURE: z
      .string()
      .or(z.boolean())
      .transform((val) => val === true || val === 'true')
      .default(false),

    // MFA
    MFA_CHALLENGE_COOKIE_NAME: z.string().min(1).default('wv_mfa_challenge'),
    MFA_CHALLENGE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    MFA_CHALLENGE_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    MFA_ISSUER: z.string().min(1).default('WinVane.ai'),

    // CSRF
    CSRF_SECRET: z
      .string()
      .min(32, 'CSRF_SECRET must be at least 32 characters'),
    CSRF_COOKIE_NAME: z.string().min(1).default('wv_csrf'),

    // Encryption at rest
    DATA_ENCRYPTION_KEY: z
      .string()
      .min(1)
      .refine(
        (val) => {
          try {
            const buf = Buffer.from(val, 'base64');
            return buf.length === 32;
          } catch {
            return false;
          }
        },
        {
          message:
            'DATA_ENCRYPTION_KEY must be a valid base64 string decoding to exactly 32 bytes',
        },
      ),

    // Rate limiting & lockout
    THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
    AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),
    ADMIN_AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(5),
    ADMIN_AUTH_THROTTLE_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(900),
    LOGIN_LOCKOUT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
    ADMIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(30),

    // Mail
    MAIL_PROVIDER: z.enum(['smtp', 'ethereal']).default('smtp'),
    MAIL_FROM: z.string().default('WinVane.ai <no-reply@winvane.ai>'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_SECURE: z
      .string()
      .or(z.boolean())
      .transform((val) => val === true || val === 'true')
      .default(false),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASSWORD: z.string().optional().default(''),
    MAIL_TEST_TO: z.string().email().default('dev@example.com'),

    // Superadmin seed
    SUPERADMIN_EMAIL: z.string().optional().default(''),
    SUPERADMIN_PASSWORD: z.string().optional().default(''),
    SUPERADMIN_FULL_NAME: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production' && !data.COOKIE_SECURE) {
        return false;
      }
      return true;
    },
    {
      message: 'COOKIE_SECURE must be true when NODE_ENV is production',
      path: ['COOKIE_SECURE'],
    },
  )
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production' && data.MAIL_PROVIDER === 'ethereal') {
        return false;
      }
      return true;
    },
    {
      message: 'MAIL_PROVIDER cannot be ethereal in production',
      path: ['MAIL_PROVIDER'],
    },
  );

export type TEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): TEnv {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const invalidKeys = result.error.issues.map((issue) =>
      issue.path.join('.'),
    );
    // ARK-03-02-052 §7.4: Never log secret or credential values
    process.stderr.write(
      `[Config] Invalid environment configuration keys: ${invalidKeys.join(', ')}\n`,
    );
    process.exit(1);
  }

  return result.data;
}

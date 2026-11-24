import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL is required in .env and must be a valid URL'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .min(1, 'NEXT_PUBLIC_APP_NAME is required')
    .default('WinVane.ai'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const serverEnvSchema = z.object({
  SESSION_COOKIE_NAME: z.string().min(1, 'SESSION_COOKIE_NAME is required').default('wv_session'),
});

const parsedPublicEnv = publicEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsedPublicEnv.success) {
  const invalidKeys = parsedPublicEnv.error.issues
    .map((issue) => issue.path.join('.'))
    .join(', ');
  throw new Error(`[Env] Invalid frontend configuration keys: ${invalidKeys}`);
}

const parsedServerEnv = serverEnvSchema.safeParse({
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
});

const appUrl = parsedPublicEnv.data.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
const apiUrl = parsedPublicEnv.data.NEXT_PUBLIC_API_URL ?? `${appUrl}/api/v1`;

export const env = {
  ...parsedPublicEnv.data,
  NEXT_PUBLIC_API_URL: apiUrl,
  SESSION_COOKIE_NAME: parsedServerEnv.success
    ? parsedServerEnv.data.SESSION_COOKIE_NAME
    : 'wv_session',
} as const;

export type TEnv = typeof env;

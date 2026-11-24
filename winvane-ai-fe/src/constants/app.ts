import { env } from '@/config/env';

export const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;
export const APP_URL = env.NEXT_PUBLIC_APP_URL;
export const SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME;
export const CSRF_HEADER_NAME = 'x-csrf-token';


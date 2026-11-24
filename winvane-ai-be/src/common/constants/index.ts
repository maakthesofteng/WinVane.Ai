export const REDIS_CLIENT = 'REDIS_CLIENT';
export const SESSION_CACHE_PREFIX = 'session:';
export const EMAIL_QUEUE = 'EMAIL_QUEUE';
export const MAIL_PROVIDER_TOKEN = 'MAIL_PROVIDER_TOKEN';
export const REQUEST_ID_HEADER = 'x-request-id';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export const SESSION_COOKIE_NAME = 'wv_session';
export const ADMIN_SESSION_COOKIE_NAME = 'wv_admin_session';
export const MFA_CHALLENGE_COOKIE_NAME = 'wv_mfa_challenge';
export const JWT_COOKIE_NAME = SESSION_COOKIE_NAME;

export const THROTTLER_NAME_DEFAULT = 'default';
export const THROTTLER_NAME_AUTH = 'auth';
export const THROTTLER_NAME_ADMIN_AUTH = 'admin-auth';

export * from './passwordPolicy.constants';
export * from './errorCodes.constants';

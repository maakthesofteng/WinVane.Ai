import { ROUTES, sanitizeRedirectUrl } from '@/constants/routes';

export function getSafeRedirectUrl(
  url: string | null | undefined,
  fallback: string = ROUTES.DASHBOARD
): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();

  // Validate strictly relative path
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback;
  }

  // Prevent javascript: or other pseudo-protocols disguised in path
  if (trimmed.includes(':')) {
    return fallback;
  }

  return sanitizeRedirectUrl(trimmed, fallback);
}


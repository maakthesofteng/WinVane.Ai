export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACCEPT_INVITE: '/accept-invite',
  MFA: '/mfa',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  SETTINGS_SECURITY: '/settings/security',
  COMPANY_BRAIN: '/company-brain',
  TEAM: '/teams',
  TEAMS: '/teams',
  ROLES_PERMISSIONS: '/roles-permissions',
  SUPERADMIN_LOGIN: '/login/superadmin',
  SUPERADMIN_MFA_SETUP: '/login/superadmin/mfa-setup',
  SUPERADMIN_MFA: '/login/superadmin/mfa',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_AUDIT_LOG: '/admin/audit-log',
  ADMIN_SECURITY: '/admin/security',
  UI_KIT: '/ui-kit',
} as const;

export const SUPERADMIN_AUTH_ROUTES: readonly string[] = [
  ROUTES.SUPERADMIN_LOGIN,
  ROUTES.SUPERADMIN_MFA_SETUP,
  ROUTES.SUPERADMIN_MFA,
];

export const AUTH_ROUTES: readonly string[] = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  ROUTES.ACCEPT_INVITE,
  ROUTES.MFA,
];

export const PROTECTED_PREFIXES: readonly string[] = [
  ROUTES.DASHBOARD,
  ROUTES.SETTINGS,
  ROUTES.TEAMS,
  ROUTES.COMPANY_BRAIN,
  ROUTES.ROLES_PERMISSIONS,
  '/admin',
];

export const ADMIN_ROUTES: readonly string[] = [
  '/admin',
  ROUTES.ADMIN_DASHBOARD,
  ROUTES.ADMIN_TENANTS,
  ROUTES.ADMIN_AUDIT_LOG,
  ROUTES.ADMIN_SECURITY,
];

export const PUBLIC_ROUTES: readonly string[] = [
  ...AUTH_ROUTES,
  ROUTES.UI_KIT,
];

export function sanitizeRedirectUrl(
  url: string | null | undefined,
  fallback: string = ROUTES.DASHBOARD
): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }
  const trimmed = url.trim();
  // Ensure same-origin relative path and prevent protocol-relative '//' attacks
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed;
  }
  return fallback;
}

export type TRouteAccessResult = {
  shouldRedirect: boolean;
  destination?: string;
};

export interface IRouteAccessOptions {
  hasTenantCookie?: boolean;
  hasAdminCookie?: boolean;
}

export function resolveRouteAccess(
  pathname: string,
  auth: IRouteAccessOptions | boolean,
  nextParam?: string | null
): TRouteAccessResult {
  const hasTenantCookie =
    typeof auth === 'boolean' ? auth : Boolean(auth?.hasTenantCookie);
  const hasAdminCookie =
    typeof auth === 'boolean' ? false : Boolean(auth?.hasAdminCookie);

  // 1. Most-specific first: SuperAdmin login & MFA routes
  const isSuperAdminAuthRoute =
    pathname === ROUTES.SUPERADMIN_LOGIN ||
    pathname.startsWith(`${ROUTES.SUPERADMIN_LOGIN}/`);

  if (isSuperAdminAuthRoute) {
    if (hasAdminCookie) {
      return {
        shouldRedirect: true,
        destination: ROUTES.ADMIN_DASHBOARD,
      };
    }
    // Tenant cookie does not redirect SuperAdmin auth routes
    return { shouldRedirect: false };
  }

  // 2. Admin portal routes (/admin, /admin/*)
  const isAdminRoute =
    pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdminRoute) {
    if (!hasAdminCookie) {
      return {
        shouldRedirect: true,
        destination: ROUTES.SUPERADMIN_LOGIN,
      };
    }
    return { shouldRedirect: false };
  }

  // 3. Tenant protected routes (/dashboard, /settings, /teams, /roles-permissions)
  const isTenantProtected =
    pathname === ROUTES.DASHBOARD ||
    pathname.startsWith(`${ROUTES.DASHBOARD}/`) ||
    pathname === ROUTES.SETTINGS ||
    pathname.startsWith(`${ROUTES.SETTINGS}/`) ||
    pathname === ROUTES.TEAMS ||
    pathname.startsWith(`${ROUTES.TEAMS}/`) ||
    pathname === ROUTES.COMPANY_BRAIN ||
    pathname.startsWith(`${ROUTES.COMPANY_BRAIN}/`) ||
    pathname === ROUTES.ROLES_PERMISSIONS ||
    pathname.startsWith(`${ROUTES.ROLES_PERMISSIONS}/`) ||
    pathname === '/team' ||
    pathname.startsWith('/team/');

  if (isTenantProtected) {
    if (!hasTenantCookie) {
      const encodedNext = encodeURIComponent(pathname);
      return {
        shouldRedirect: true,
        destination: `${ROUTES.LOGIN}?next=${encodedNext}`,
      };
    }
    return { shouldRedirect: false };
  }

  // 4. Tenant entry routes (/login, /register) redirect logged-in tenant users away to dashboard
  const isTenantEntryRoute =
    pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER;

  if (isTenantEntryRoute && hasTenantCookie) {
    const destination = sanitizeRedirectUrl(nextParam, ROUTES.DASHBOARD);
    return {
      shouldRedirect: true,
      destination,
    };
  }

  // 5. Root route
  if (pathname === ROUTES.HOME) {
    if (hasTenantCookie) {
      return { shouldRedirect: true, destination: ROUTES.DASHBOARD };
    }
    if (hasAdminCookie) {
      return { shouldRedirect: true, destination: ROUTES.ADMIN_DASHBOARD };
    }
    return { shouldRedirect: true, destination: ROUTES.LOGIN };
  }

  return { shouldRedirect: false };
}

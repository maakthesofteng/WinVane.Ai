import { NextResponse, type NextRequest } from 'next/server';
import { resolveRouteAccess } from '@/constants/routes';

export function proxy(request: NextRequest) {
  const tenantCookieName = process.env.SESSION_COOKIE_NAME || 'wv_session';
  const adminCookieName =
    process.env.ADMIN_SESSION_COOKIE_NAME || 'wv_admin_session';

  const hasTenantCookie = Boolean(request.cookies.get(tenantCookieName)?.value);
  const hasAdminCookie = Boolean(request.cookies.get(adminCookieName)?.value);

  const { pathname, searchParams } = request.nextUrl;
  const nextParam = searchParams.get('next');

  const access = resolveRouteAccess(
    pathname,
    { hasTenantCookie, hasAdminCookie },
    nextParam
  );

  if (access.shouldRedirect && access.destination) {
    const redirectUrl = new URL(access.destination, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export default proxy;

import { NextResponse, NextRequest } from 'next/server';

// All real app content lives under /admin/**; src/pages/login sets the
// `auth_token` cookie this checks (js-cookie, alongside localStorage —
// see src/services/auth.service.ts for why both exist).
//
// This is a presence check, not a signature/expiry check: the JWT
// secret is backend-only and deliberately not shared with this
// deployment. A stale or tampered cookie still passes here — it just
// means the first API call the page makes gets a real 401 from the
// backend's authenticateToken, which remains the actual security
// boundary. What this closes is the previous no-op ("allow everything,
// client-side handles it"), which let an unauthenticated request load a
// protected page's full bundle before any client-side check ran.
//
// Since this is a presence check only, the cookie's VALUE is a fixed
// marker ('1'), not the real JWT — the actual token lives only in
// localStorage. Putting the full JWT in this cookie previously caused a
// live bug: the JWT embeds the caller's entire role/permissions object,
// which can exceed the ~4KB per-cookie limit browsers enforce (it did,
// once a role carried enough permission keys), silently failing to
// store and making every navigation look logged-out. A 1-byte marker
// can never hit that limit.
const PROTECTED_PREFIX = '/admin';
const LOGIN_PATH = '/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  if (pathname.startsWith(PROTECTED_PREFIX) && !authToken) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === LOGIN_PATH && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
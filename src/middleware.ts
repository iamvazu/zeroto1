import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'zeroto1_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'zeroto1-secret-key-32-bytes-minimum-security-2026'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /app routes
  if (pathname.startsWith('/app')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(signInUrl);
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Invalid or expired token
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('from', pathname);
      const res = NextResponse.redirect(signInUrl);
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};

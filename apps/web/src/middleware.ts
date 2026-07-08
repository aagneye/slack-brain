import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAuthenticatedSession } from '@/lib/auth-session';

/**
 * Protect the authenticated portal. Slack/API webhook routes verify their own
 * signatures and must stay public, so they are excluded by the matcher.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith('/brain') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/connectors') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/audit');

  if (isProtected && !isAuthenticatedSession(req.auth)) {
    const url = new URL('/signup', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/brain/:path*',
    '/dashboard/:path*',
    '/connectors/:path*',
    '/history/:path*',
    '/jobs/:path*',
    '/audit/:path*',
  ],
};

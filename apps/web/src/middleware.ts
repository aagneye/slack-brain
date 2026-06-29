import { auth } from '@/auth';

/**
 * Protect the authenticated portal. Slack/API webhook routes verify their own
 * signatures and must stay public, so they are excluded by the matcher.
 */
export default auth((req) => {
  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/connectors') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/audit');

  if (isProtected && !isAuthed) {
    const url = new URL('/login', req.nextUrl.origin);
    return Response.redirect(url);
  }
  return undefined;
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/connectors/:path*',
    '/history/:path*',
    '/jobs/:path*',
    '/audit/:path*',
  ],
};

import { NextResponse } from 'next/server';
import { envVar, getAuthBaseUrl, getOAuthProviderFlags } from '@/lib/oauth-providers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/auth/status — which OAuth providers are configured (no secrets). */
export async function GET() {
  const providers = getOAuthProviderFlags();
  const baseUrl = getAuthBaseUrl().replace(/\/$/, '');
  const hasAuthSecret = !!envVar('AUTH_SECRET');
  const providerCount = Object.values(providers).filter(Boolean).length;

  return NextResponse.json({
    providers,
    baseUrl,
    authReady: hasAuthSecret && providerCount > 0,
    hasAuthSecret,
    providerCount,
    callbacks: {
      google: `${baseUrl}/api/auth/callback/google`,
      slack: `${baseUrl}/api/auth/callback/slack`,
    },
    slackOidcChecks: ['pkce', 'nonce'],
  });
}

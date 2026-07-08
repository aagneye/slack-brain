import { NextResponse } from 'next/server';
import { getAuthBaseUrl, getOAuthProviderFlags } from '@/lib/oauth-providers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/auth/status — which OAuth providers are configured (no secrets). */
export async function GET() {
  const providers = getOAuthProviderFlags();
  const baseUrl = getAuthBaseUrl().replace(/\/$/, '');

  return NextResponse.json({
    providers,
    baseUrl,
    callbacks: {
      google: `${baseUrl}/api/auth/callback/google`,
      slack: `${baseUrl}/api/auth/callback/slack`,
    },
  });
}

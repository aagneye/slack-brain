import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Slack from 'next-auth/providers/slack';
import { envVar } from '@/lib/oauth-providers';

/**
 * Resolves AUTH_SECRET. Production requires a real value; dev uses a local fallback so
 * `npm run dev` works before `.env` is fully filled in.
 */
export function resolveAuthSecret(): string {
  const secret = envVar('AUTH_SECRET');
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development') {
    return 'development-only-insecure-auth-secret';
  }
  throw new Error('AUTH_SECRET is required in production');
}

function buildProviders() {
  const providers: NextAuthConfig['providers'] = [];

  const googleId = envVar('GOOGLE_CLIENT_ID');
  const googleSecret = envVar('GOOGLE_CLIENT_SECRET');
  if (googleId && googleSecret) {
    providers.push(Google({ clientId: googleId, clientSecret: googleSecret }));
  }

  const slackId = envVar('SLACK_CLIENT_ID');
  const slackSecret = envVar('SLACK_CLIENT_SECRET');
  if (slackId && slackSecret) {
    // Auth.js v5 + Slack OIDC: nonce must be listed in checks or callback fails
    // with "unexpected ID Token nonce claim value" (surfaced as Configuration error).
    providers.push(
      Slack({
        clientId: slackId,
        clientSecret: slackSecret,
        checks: ['pkce', 'nonce'],
      }),
    );
  }

  return providers;
}

export function getAuthConfig(): NextAuthConfig {
  return {
    trustHost: true,
    secret: resolveAuthSecret(),
    providers: buildProviders(),
    debug: process.env.NODE_ENV === 'development',
    session: { strategy: 'jwt' },
    callbacks: {
      async jwt({ token, profile, trigger, session }) {
        // Client `update({ disconnectSlack: true })` clears workspace link without full sign-out.
        if (trigger === 'update') {
          const patch = session as { disconnectSlack?: boolean } | null;
          if (patch?.disconnectSlack) {
            delete token.slackTeamId;
          }
        }

        const slackProfile = profile as { 'https://slack.com/team_id'?: string } | undefined;
        if (slackProfile?.['https://slack.com/team_id']) {
          token.slackTeamId = slackProfile['https://slack.com/team_id'];
        }
        return token;
      },
      async session({ session, token }) {
        if (token.slackTeamId) {
          (session as { slackTeamId?: string }).slackTeamId = token.slackTeamId as string;
        } else {
          delete (session as { slackTeamId?: string }).slackTeamId;
        }
        return session;
      },
    },
    pages: {
      signIn: '/signup',
    },
  };
}

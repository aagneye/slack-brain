import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Slack from 'next-auth/providers/slack';

/**
 * Resolves AUTH_SECRET. Production requires a real value; dev uses a local fallback so
 * `npm run dev` works before `.env` is fully filled in.
 */
export function resolveAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development') {
    return 'development-only-insecure-auth-secret';
  }
  throw new Error('AUTH_SECRET is required in production');
}

function buildProviders() {
  const providers: NextAuthConfig['providers'] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) {
    providers.push(
      Slack({
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
      }),
    );
  }

  return providers;
}

export const authConfig = {
  trustHost: true,
  secret: resolveAuthSecret(),
  providers: buildProviders(),
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, profile }) {
      const slackProfile = profile as { 'https://slack.com/team_id'?: string } | undefined;
      if (slackProfile?.['https://slack.com/team_id']) {
        token.slackTeamId = slackProfile['https://slack.com/team_id'];
      }
      return token;
    },
    async session({ session, token }) {
      if (token.slackTeamId) {
        (session as { slackTeamId?: string }).slackTeamId = token.slackTeamId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signup',
  },
} satisfies NextAuthConfig;

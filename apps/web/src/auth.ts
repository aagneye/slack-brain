import NextAuth from 'next-auth';
import Slack from 'next-auth/providers/slack';

/**
 * Auth.js configuration.
 *
 * "Sign in with Slack" (OpenID Connect) authenticates the user AND establishes
 * which Slack workspace/team they belong to — so logging in is also the first
 * step of connecting Slack. The team id is persisted on the session so the rest
 * of the app can scope every query to that workspace.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Slack({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, profile }) {
      // Slack OIDC profile includes the team (workspace) id.
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
    signIn: '/login',
  },
});

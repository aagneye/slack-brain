import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Slack from 'next-auth/providers/slack';

/**
 * Auth.js configuration.
 *
 * Sign in with Google or Slack. Slack OIDC also links the workspace team id
 * so every query can be scoped to that workspace.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
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
    signIn: '/signup',
  },
});

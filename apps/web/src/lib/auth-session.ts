import type { Session } from 'next-auth';

export type AppSession = Session & { slackTeamId?: string };

/** True when Auth.js returned a signed-in user (not a broken/partial session). */
export function isAuthenticatedSession(
  session: Session | AppSession | null | undefined,
): session is AppSession {
  if (!session?.user) return false;
  return !!(session.user.email ?? session.user.name);
}

export function getSessionUser(session: AppSession | null) {
  return {
    name: session?.user?.name ?? session?.user?.email ?? 'Guest',
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
    slackTeamId: session?.slackTeamId ?? null,
  };
}

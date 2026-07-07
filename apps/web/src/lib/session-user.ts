import type { Session } from 'next-auth';

export type AppSession = Session & { slackTeamId?: string };

export function getSessionUser(session: AppSession | null) {
  return {
    name: session?.user?.name ?? 'Guest',
    email: session?.user?.email ?? null,
    image: session?.user?.image ?? null,
    slackTeamId: session?.slackTeamId ?? null,
  };
}

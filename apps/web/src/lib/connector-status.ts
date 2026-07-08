import { prisma } from '@cpe/db';
import type { AppSession } from '@/lib/auth-session';
import { resolveWorkspaceUser } from '@/lib/workspace';

export type SlackConnectionStatus = {
  workspace: {
    connected: boolean;
    slackTeamId: string | null;
    name: string | null;
  };
  slackSearch: {
    connected: boolean;
  };
  slackBot: {
    installed: boolean;
  };
  checkedAt: string;
};

/** Live connector status for the signed-in user and workspace. */
export async function getSlackConnectionStatus(
  session: AppSession | null,
): Promise<SlackConnectionStatus> {
  const slackTeamId = session?.slackTeamId ?? null;
  const workspace = slackTeamId
    ? await prisma.workspace.findUnique({ where: { slackTeamId } })
    : null;

  let hasUserSearchToken = false;
  if (workspace && session?.user && slackTeamId) {
    const { user } = await resolveWorkspaceUser({
      slackTeamId,
      slackUserId: session.user.email ?? session.user.name ?? 'web-user',
      name: session.user.name,
      email: session.user.email,
    });
    hasUserSearchToken = !!user.slackSearchTokenRef;
  }

  const connectors = workspace
    ? await prisma.connector.findMany({ where: { workspaceId: workspace.id } })
    : [];
  const connectedKinds = new Set(connectors.map((c) => c.kind));
  if (hasUserSearchToken) connectedKinds.add('slack_search');

  return {
    workspace: {
      connected: !!slackTeamId,
      slackTeamId,
      name: workspace?.name ?? null,
    },
    slackSearch: {
      connected: connectedKinds.has('slack_search'),
    },
    slackBot: {
      installed: !!process.env.SLACK_BOT_TOKEN,
    },
    checkedAt: new Date().toISOString(),
  };
}

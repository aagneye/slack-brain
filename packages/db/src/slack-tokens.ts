import { prisma } from './client.js';

/**
 * Resolves the Slack **user** token used for `search.messages` for a job.
 *
 * Priority:
 * 1. Requesting user's token (stored when they connect Slack Search in the portal)
 * 2. Workspace connector `slack_search` token ref
 * 3. `SLACK_USER_TOKEN` env fallback (dev / single-user workspaces)
 *
 * Never returns SLACK_BOT_TOKEN — bot tokens cannot search.
 */
export async function resolveSlackSearchToken(input: {
  userId: string;
  workspaceId: string;
}): Promise<{ token: string; source: 'user' | 'workspace' | 'env' } | null> {
  const user = await prisma.appUser.findUnique({ where: { id: input.userId } });
  if (user?.slackSearchTokenRef) {
    return { token: user.slackSearchTokenRef, source: 'user' };
  }

  const workspaceConnector = await prisma.connector.findFirst({
    where: { workspaceId: input.workspaceId, kind: 'slack_search', status: 'active' },
  });
  if (workspaceConnector?.tokenRef) {
    return { token: workspaceConnector.tokenRef, source: 'workspace' };
  }

  const envToken = process.env.SLACK_USER_TOKEN;
  if (envToken) {
    return { token: envToken, source: 'env' };
  }

  return null;
}

export const users = {
  setSlackSearchToken(userId: string, tokenRef: string) {
    return prisma.appUser.update({
      where: { id: userId },
      data: { slackSearchTokenRef: tokenRef },
    });
  },

  clearSlackSearchToken(userId: string) {
    return prisma.appUser.update({
      where: { id: userId },
      data: { slackSearchTokenRef: null },
    });
  },
};

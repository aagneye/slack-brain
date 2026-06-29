import { prisma } from '@cpe/db';

/**
 * Resolves (and lazily provisions) the Workspace + AppUser for an authenticated
 * session, keyed by the Slack team id captured at login. Every job is scoped to
 * the returned workspace.
 */
export async function resolveWorkspaceUser(input: {
  slackTeamId: string;
  slackUserId: string;
  name?: string | null;
  email?: string | null;
}) {
  const workspace = await prisma.workspace.upsert({
    where: { slackTeamId: input.slackTeamId },
    update: {},
    create: { slackTeamId: input.slackTeamId, name: input.name ?? 'Workspace' },
  });

  const user = await prisma.appUser.upsert({
    where: {
      workspaceId_slackUserId: { workspaceId: workspace.id, slackUserId: input.slackUserId },
    },
    update: { displayName: input.name ?? undefined, email: input.email ?? undefined },
    create: {
      workspaceId: workspace.id,
      slackUserId: input.slackUserId,
      displayName: input.name ?? undefined,
      email: input.email ?? undefined,
    },
  });

  return { workspace, user };
}

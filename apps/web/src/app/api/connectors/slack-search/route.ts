import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertSlackSearchToken } from '@cpe/shared';
import { auth } from '@/auth';
import { resolveWorkspaceUser } from '@/lib/workspace';
import { users, audit } from '@cpe/db';

const bodySchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/connectors/slack-search — store the user's Slack search token (xoxp-).
 * Used for search.messages scoped to what this user can read.
 */
export async function POST(req: Request) {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  if (!session?.user || !slackTeamId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  try {
    assertSlackSearchToken(parsed.data.token);
  } catch (err) {
    return NextResponse.json({ error: 'invalid_token', detail: (err as Error).message }, { status: 400 });
  }

  const { workspace, user } = await resolveWorkspaceUser({
    slackTeamId,
    slackUserId: session.user.email ?? session.user.name ?? 'web-user',
    name: session.user.name,
    email: session.user.email,
  });

  // MVP: store token ref inline; production should encrypt / use a secret manager.
  await users.setSlackSearchToken(user.id, parsed.data.token);

  await audit.record({
    workspaceId: workspace.id,
    actor: user.id,
    eventType: 'connector.slack_search.connected',
    payload: { userId: user.id },
  });

  return NextResponse.json({ ok: true, kind: 'slack_search', scope: 'user' });
}

/** DELETE /api/connectors/slack-search — remove the user's Slack search token. */
export async function DELETE() {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  if (!session?.user || !slackTeamId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { workspace, user } = await resolveWorkspaceUser({
    slackTeamId,
    slackUserId: session.user.email ?? session.user.name ?? 'web-user',
    name: session.user.name,
    email: session.user.email,
  });

  await users.clearSlackSearchToken(user.id);

  await audit.record({
    workspaceId: workspace.id,
    actor: user.id,
    eventType: 'connector.slack_search.disconnected',
    payload: { userId: user.id },
  });

  return NextResponse.json({ ok: true, kind: 'slack_search', scope: 'user' });
}

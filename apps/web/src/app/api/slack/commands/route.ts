import { NextResponse } from 'next/server';
import { jobs, audit } from '@cpe/db';
import { resolveWorkspaceUser } from '@/lib/workspace';
import { enqueueContextJob } from '@/lib/queue';
import { readVerifiedSlackBody } from '@/lib/slack-verify';

export const runtime = 'nodejs';

/**
 * POST /api/slack/commands — handles `/contextpack <task>`.
 *
 * Slack requires a response within 3s, so we resolve the workspace, enqueue the
 * job, and immediately reply with a "Building Context Pack…" message. The worker
 * updates that message as it progresses.
 */
export async function POST(req: Request) {
  const rawBody = await readVerifiedSlackBody(req);
  if (rawBody === null) return new NextResponse('invalid signature', { status: 401 });

  const params = new URLSearchParams(rawBody);
  const task = (params.get('text') ?? '').trim();
  const teamId = params.get('team_id') ?? '';
  const userId = params.get('user_id') ?? '';
  const channelId = params.get('channel_id') ?? undefined;

  if (task.length < 3) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Usage: `/contextpack <what you want to investigate>`',
    });
  }

  const { workspace, user } = await resolveWorkspaceUser({
    slackTeamId: teamId,
    slackUserId: userId,
  });

  const job = await jobs.create({
    workspaceId: workspace.id,
    requestedBy: user.id,
    taskText: task,
    sourceChannel: channelId,
  });

  await audit.record({
    workspaceId: workspace.id,
    actor: user.id,
    jobId: job.id,
    eventType: 'job.created',
    payload: { task, via: 'slack' },
  });

  await enqueueContextJob({
    jobId: job.id,
    workspaceId: workspace.id,
    task,
    createdBy: user.id,
    channel: channelId,
  });

  return NextResponse.json({
    response_type: 'ephemeral',
    text: `🧠 Building Context Pack for: *${task}*\nI'll update here as I gather and verify context. (job \`${job.id}\`)`,
  });
}

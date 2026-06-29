import { NextResponse } from 'next/server';
import { createJobSchema } from '@cpe/shared';
import { jobs, audit } from '@cpe/db';
import { auth } from '@/auth';
import { resolveWorkspaceUser } from '@/lib/workspace';
import { enqueueContextJob } from '@/lib/queue';

/** POST /api/jobs — create a context job and enqueue it for the worker. */
export async function POST(req: Request) {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  if (!session?.user || !slackTeamId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  }

  const { workspace, user } = await resolveWorkspaceUser({
    slackTeamId,
    slackUserId: session.user.email ?? session.user.name ?? 'web-user',
    name: session.user.name,
    email: session.user.email,
  });

  const job = await jobs.create({
    workspaceId: workspace.id,
    requestedBy: user.id,
    taskText: parsed.data.task,
    sourceChannel: parsed.data.channel,
    threadTs: parsed.data.threadTs,
  });

  await audit.record({
    workspaceId: workspace.id,
    actor: user.id,
    jobId: job.id,
    eventType: 'job.created',
    payload: { task: parsed.data.task, via: 'web' },
  });

  await enqueueContextJob({
    jobId: job.id,
    workspaceId: workspace.id,
    task: parsed.data.task,
    createdBy: user.id,
    channel: parsed.data.channel,
    threadTs: parsed.data.threadTs,
  });

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}

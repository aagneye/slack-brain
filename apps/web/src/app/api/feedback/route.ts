import { NextResponse } from 'next/server';
import { feedbackSchema } from '@cpe/shared';
import { prisma } from '@cpe/db';
import { auth } from '@/auth';

/** POST /api/feedback — capture thumbs up/down on a pack or item. */
export async function POST(req: Request) {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  if (!session?.user || !slackTeamId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slackTeamId } });
  const user = workspace
    ? await prisma.appUser.findFirst({ where: { workspaceId: workspace.id } })
    : null;
  if (!workspace || !user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await prisma.feedback.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      rating: parsed.data.rating,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ ok: true });
}

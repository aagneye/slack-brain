import { NextResponse } from 'next/server';
import { jobs, prisma } from '@cpe/db';
import { auth } from '@/auth';

/** GET /api/jobs/:id — current status + stage detail (and pack slug when done). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const job = await jobs.byId(params.id);
  if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const pack = await prisma.contextPack.findUnique({ where: { jobId: job.id } });

  return NextResponse.json({
    id: job.id,
    status: job.status,
    stageDetail: job.stageDetail,
    error: job.error,
    packSlug: pack?.permalinkSlug ?? null,
    confidence: pack?.confidence ?? null,
  });
}

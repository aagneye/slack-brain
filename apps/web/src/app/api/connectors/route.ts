import { NextResponse } from 'next/server';
import { prisma } from '@cpe/db';
import { auth } from '@/auth';

/** GET /api/connectors — list connectors + status for the current workspace. */
export async function GET() {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  if (!session?.user || !slackTeamId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slackTeamId } });
  if (!workspace) return NextResponse.json({ connectors: [] });

  const connectors = await prisma.connector.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, kind: true, status: true, scopes: true, lastHealth: true },
  });

  return NextResponse.json({ connectors });
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAuthenticatedSession } from '@/lib/auth-session';
import { getSlackConnectionStatus } from '@/lib/connector-status';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/connectors/status — live Slack / connector status for the dashboard. */
export async function GET() {
  const session = await auth();
  if (!isAuthenticatedSession(session)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const status = await getSlackConnectionStatus(session);
  return NextResponse.json(status);
}

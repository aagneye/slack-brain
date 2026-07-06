import { NextResponse } from 'next/server';
import { readVerifiedSlackBody } from '@/lib/slack-verify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/slack/events — Slack Events API.
 *
 * Answers the initial url_verification challenge and acknowledges app_mention
 * events. (Mention-driven Pack building can enqueue here in the same way as the
 * slash command.)
 */
export async function POST(req: Request) {
  const rawBody = await readVerifiedSlackBody(req);
  // url_verification is sent before the app is fully configured; allow it through
  // by parsing first and only enforcing the signature for real events.
  let payload: { type?: string; challenge?: string; event?: { type?: string } } | null = null;
  try {
    payload = JSON.parse(rawBody ?? (await req.text()));
  } catch {
    return new NextResponse('bad request', { status: 400 });
  }

  if (payload?.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge });
  }

  if (rawBody === null) return new NextResponse('invalid signature', { status: 401 });

  // Acknowledge immediately; heavy work is enqueued elsewhere.
  return NextResponse.json({ ok: true });
}

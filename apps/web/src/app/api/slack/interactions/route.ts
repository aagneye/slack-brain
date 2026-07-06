import { NextResponse } from 'next/server';
import type { ContextPack, LLMModel } from '@cpe/shared';
import { prisma, audit } from '@cpe/db';
import { readVerifiedSlackBody } from '@/lib/slack-verify';
import { buildGateway } from '@/lib/llm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/slack/interactions — Block Kit button actions.
 *
 * Handles the Send-to-AI buttons (value `send:<model>:<packId>`). The Pack is
 * formatted and routed through the LLM gateway; the result is returned to Slack.
 */
export async function POST(req: Request) {
  const rawBody = await readVerifiedSlackBody(req);
  if (rawBody === null) return new NextResponse('invalid signature', { status: 401 });

  const params = new URLSearchParams(rawBody);
  const payload = JSON.parse(params.get('payload') ?? '{}') as {
    actions?: Array<{ value?: string }>;
  };
  const value = payload.actions?.[0]?.value ?? '';
  const [action, model, packId] = value.split(':');

  if (action !== 'send' || !packId) {
    return NextResponse.json({ text: 'Unsupported action.' });
  }

  const row = await prisma.contextPack.findUnique({ where: { id: packId } });
  if (!row) return NextResponse.json({ text: 'Context Pack not found.' });

  const pack = row.packJson as unknown as ContextPack;
  const gateway = buildGateway();

  try {
    const result = await gateway.send(pack, model as LLMModel);
    await prisma.llmSend.create({
      data: { packId: row.id, model: model!, status: result.kind === 'answer' ? 'answered' : 'sent', responseRef: result.handoffUrl },
    });
    await audit.record({
      workspaceId: row.workspaceId,
      actor: 'slack-user',
      eventType: 'llm.sent',
      payload: { packId: row.id, model, via: 'slack' },
    });

    const text =
      result.kind === 'handoff'
        ? `Opening in Cursor: ${result.handoffUrl}`
        : `*Answer from ${model}:*\n${result.text?.slice(0, 2900) ?? ''}`;
    return NextResponse.json({ response_type: 'in_channel', text });
  } catch (err) {
    return NextResponse.json({ text: `Send failed: ${(err as Error).message}` });
  }
}

import { NextResponse } from 'next/server';
import type { ContextPack } from '@cpe/shared';
import { sendPackSchema } from '@cpe/shared';
import { prisma, audit } from '@cpe/db';
import { auth } from '@/auth';
import { buildGateway } from '@/lib/llm';

/** POST /api/packs/:id/send — format the Pack and send it to the chosen model. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = sendPackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  }

  const row = await prisma.contextPack.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let pack = row.packJson as unknown as ContextPack;

  // Apply item include/exclude overrides if provided.
  if (parsed.data.includedItemIds) {
    const allow = new Set(parsed.data.includedItemIds);
    const filterSection = (items: ContextPack['sections']['documents']) =>
      items.map((it) => ({ ...it, included: allow.has(it.id) }));
    pack = {
      ...pack,
      sections: Object.fromEntries(
        Object.entries(pack.sections).map(([k, v]) => [k, filterSection(v)]),
      ) as ContextPack['sections'],
    };
  }

  const gateway = buildGateway();
  let result;
  try {
    result = await gateway.send(pack, parsed.data.model);
  } catch (err) {
    return NextResponse.json({ error: 'send_failed', detail: (err as Error).message }, { status: 502 });
  }

  await prisma.llmSend.create({
    data: {
      packId: row.id,
      model: parsed.data.model,
      includedItems: parsed.data.includedItemIds ?? [],
      status: result.kind === 'answer' ? 'answered' : 'sent',
      responseRef: result.handoffUrl,
    },
  });

  await audit.record({
    workspaceId: row.workspaceId,
    actor: session.user.email ?? 'web-user',
    eventType: 'llm.sent',
    payload: { packId: row.id, model: parsed.data.model, kind: result.kind },
  });

  return NextResponse.json(result);
}

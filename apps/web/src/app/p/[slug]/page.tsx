import { notFound } from 'next/navigation';
import type { ContextPack } from '@cpe/shared';
import { prisma } from '@cpe/db';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { PackSection } from '@/components/PackSection';
import { SendToAIBar } from '@/components/SendToAIBar';

export default async function PackPage({ params }: { params: { slug: string } }) {
  const row = await prisma.contextPack.findUnique({ where: { permalinkSlug: params.slug } });
  if (!row) notFound();

  const pack = row.packJson as unknown as ContextPack;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Context Pack</p>
      <h1 className="mt-1 text-2xl font-bold">{pack.task}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Intent: {pack.intent} · {pack.entities.join(', ')}
      </p>

      <div className="mt-6 space-y-4">
        <ConfidenceBadge confidence={pack.confidence} />

        {pack.missingInformation.length > 0 && (
          <section className="card border-yellow-300/50">
            <h3 className="text-sm font-semibold">🕳️ Missing Information</h3>
            <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              {pack.missingInformation.map((m, i) => (
                <li key={i}>
                  <strong>{m.requirement}</strong> — {m.reason}
                </li>
              ))}
            </ul>
          </section>
        )}

        {pack.contradictions.length > 0 && (
          <section className="card border-red-300/50">
            <h3 className="text-sm font-semibold">⚔️ Contradictions</h3>
            <ul className="mt-2 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              {pack.contradictions.map((c, i) => (
                <li key={i}>
                  <p>{c.reason}</p>
                  <p className="text-xs">A: {c.claimA}</p>
                  <p className="text-xs">B: {c.claimB}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <PackSection title="Documents" items={pack.sections.documents} />
        <PackSection title="Slack Threads" items={pack.sections.slackThreads} />
        <PackSection title="Pull Requests" items={pack.sections.pullRequests} />
        <PackSection title="Jira Tickets" items={pack.sections.jiraTickets} />
        <PackSection title="Deploys" items={pack.sections.deploys} />
        <PackSection title="Incidents" items={pack.sections.incidents} />

        <SendToAIBar packId={pack.id} />
      </div>
    </main>
  );
}

import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@cpe/db';
import { AppNav } from '@/components/AppNav';

export default async function HistoryPage() {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  const workspace = slackTeamId
    ? await prisma.workspace.findUnique({ where: { slackTeamId } })
    : null;
  const packs = workspace
    ? await prisma.contextPack.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { job: true },
      })
    : [];

  return (
    <div className="min-h-screen">
      <AppNav user={{ name: session?.user?.name }} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold">History</h1>
        {packs.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No Context Packs yet.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {packs.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.permalinkSlug}`}
                  className="card flex items-center justify-between hover:border-brand"
                >
                  <span className="truncate">{p.job?.taskText ?? 'Context Pack'}</span>
                  <span className="ml-4 shrink-0 text-sm text-neutral-500">
                    {p.confidence}/100 · {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

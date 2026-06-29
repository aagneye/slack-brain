import { auth } from '@/auth';
import { prisma } from '@cpe/db';
import { AppNav } from '@/components/AppNav';

export default async function AuditPage() {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  const workspace = slackTeamId
    ? await prisma.workspace.findUnique({ where: { slackTeamId } })
    : null;
  const events = workspace
    ? await prisma.auditEvent.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    : [];

  return (
    <div className="min-h-screen">
      <AppNav user={{ name: session?.user?.name }} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Append-only record of what was searched, found and sent — &quot;what did the AI see?&quot;
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-2">When</th>
                <th>Event</th>
                <th>Actor</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={String(e.id)} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 text-neutral-500">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="font-medium">{e.eventType}</td>
                  <td className="text-neutral-500">{e.actor ?? 'system'}</td>
                  <td className="max-w-xs truncate text-neutral-500">{JSON.stringify(e.payload)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

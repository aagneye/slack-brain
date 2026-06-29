import { auth } from '@/auth';
import { prisma } from '@cpe/db';
import { AppNav } from '@/components/AppNav';

interface SourceDef {
  kind: string;
  label: string;
  description: string;
  status: 'mvp' | 'planned';
}

const CATALOG: SourceDef[] = [
  { kind: 'slack', label: 'Slack', description: 'Real-time message search.', status: 'mvp' },
  { kind: 'github', label: 'GitHub', description: 'Pull requests & issues.', status: 'mvp' },
  { kind: 'jira', label: 'Jira', description: 'Tickets & epics.', status: 'planned' },
  { kind: 'confluence', label: 'Confluence', description: 'Docs & runbooks.', status: 'planned' },
  { kind: 'notion', label: 'Notion', description: 'Docs & wikis.', status: 'planned' },
  { kind: 'incident', label: 'Incidents', description: 'PagerDuty / Opsgenie.', status: 'planned' },
];

export default async function ConnectorsPage() {
  const session = await auth();
  const slackTeamId = (session as { slackTeamId?: string } | null)?.slackTeamId;
  const workspace = slackTeamId
    ? await prisma.workspace.findUnique({ where: { slackTeamId } })
    : null;
  const connected = workspace
    ? await prisma.connector.findMany({ where: { workspaceId: workspace.id } })
    : [];
  const connectedKinds = new Set(connected.map((c) => c.kind));
  // Slack is implicitly connected via Sign in with Slack.
  connectedKinds.add('slack');

  return (
    <div className="min-h-screen">
      <AppNav user={{ name: session?.user?.name }} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold">Connectors</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Each connected source improves coverage and confidence. Tokens are stored as encrypted
          references, never in plaintext.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CATALOG.map((src) => {
            const isConnected = connectedKinds.has(src.kind);
            return (
              <div key={src.kind} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{src.label}</h3>
                    {src.status === 'planned' && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800">
                        planned
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">{src.description}</p>
                </div>
                <span
                  className={
                    isConnected
                      ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700'
                      : 'rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 dark:bg-neutral-800'
                  }
                >
                  {isConnected ? 'Connected' : src.status === 'mvp' ? 'Connect' : 'Soon'}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

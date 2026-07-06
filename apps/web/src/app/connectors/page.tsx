import { auth } from '@/auth';
import { prisma } from '@cpe/db';
import { AppNav } from '@/components/AppNav';
import { SlackSearchConnectForm } from '@/components/SlackSearchConnectForm';
import { resolveWorkspaceUser } from '@/lib/workspace';

interface SourceDef {
  kind: string;
  label: string;
  description: string;
  status: 'mvp' | 'planned';
  note?: string;
}

const CATALOG: SourceDef[] = [
  {
    kind: 'slack_search',
    label: 'Slack Search',
    description: 'Message search via user token (search:read). Scoped to what you can read.',
    status: 'mvp',
    note: 'Requires xoxp- user token — not the bot token.',
  },
  {
    kind: 'slack_bot',
    label: 'Slack Bot',
    description: 'Posts progress and Pack cards. Configured via SLACK_BOT_TOKEN on the server.',
    status: 'mvp',
  },
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

  let hasUserSearchToken = false;
  if (workspace && session?.user && slackTeamId) {
    const { user } = await resolveWorkspaceUser({
      slackTeamId,
      slackUserId: session.user.email ?? session.user.name ?? 'web-user',
      name: session.user.name,
      email: session.user.email,
    });
    hasUserSearchToken = !!user.slackSearchTokenRef;
  }

  const connected = workspace
    ? await prisma.connector.findMany({ where: { workspaceId: workspace.id } })
    : [];
  const connectedKinds = new Set(connected.map((c) => c.kind));

  const hasBotToken = !!process.env.SLACK_BOT_TOKEN;
  if (hasUserSearchToken) connectedKinds.add('slack_search');
  if (hasBotToken) connectedKinds.add('slack_bot');

  return (
    <div className="min-h-screen">
      <AppNav user={{ name: session?.user?.name }} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold">Connectors</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Slack uses <strong>two tokens</strong>: a bot token to post messages and a separate user
          token to search messages you are allowed to see.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CATALOG.map((src) => {
            const isConnected = connectedKinds.has(src.kind);
            return (
              <div key={src.kind} className="card">
                <div className="flex items-center justify-between">
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
                    {src.note && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{src.note}</p>}
                  </div>
                  <span
                    className={
                      isConnected
                        ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700'
                        : 'rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500 dark:bg-neutral-800'
                    }
                  >
                    {isConnected ? 'Connected' : src.status === 'mvp' ? 'Not connected' : 'Soon'}
                  </span>
                </div>
                {src.kind === 'slack_search' && !hasUserSearchToken && <SlackSearchConnectForm />}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

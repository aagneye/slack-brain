import { auth } from '@/auth';
import { ConnectionsManager } from '@/components/connectors/ConnectionsManager';
import { isAuthenticatedSession } from '@/lib/auth-session';
import { getSlackConnectionStatus } from '@/lib/connector-status';
import Link from 'next/link';

export default async function BrainConnectionsPage() {
  const session = await auth();
  const initial = isAuthenticatedSession(session)
    ? await getSlackConnectionStatus(session)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="premium-card relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-8 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
          Connection management
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Connectors</h1>
        <p className="mt-3 max-w-2xl text-indigo-100">
          Link Slack, manage search access, and see live connection status for your workspace.
        </p>
      </div>

      {initial ? (
        <ConnectionsManager initial={initial} />
      ) : (
        <div className="premium-card p-6 text-sm text-slate-600">
          Sign in to manage connections.
        </div>
      )}

      <section className="premium-card rounded-2xl p-5">
        <h2 className="font-semibold text-slate-900">Install in Slack</h2>
        <p className="mt-1 text-sm text-slate-600">
          Workspace admins can add the app and configure <code>/slackbrain</code>.
        </p>
        <Link href="/add-to-slack" className="btn-ghost mt-4 inline-flex rounded-2xl">
          Add Slack Brain to workspace →
        </Link>
      </section>
    </div>
  );
}

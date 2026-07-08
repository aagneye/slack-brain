import { auth } from '@/auth';
import Link from 'next/link';
import { getSessionUser } from '@/lib/session-user';

export default async function BrainProfilePage() {
  const session = await auth();
  const user = getSessionUser(session);

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-slate-500">Profile</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Your account</h1>

      <div className="card mt-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
            {user.email && <p className="text-sm text-slate-500">{user.email}</p>}
          </div>
        </div>

        <dl className="mt-8 space-y-4 border-t border-slate-100 pt-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Sign-in</dt>
            <dd className="font-medium text-slate-900">
              {user.slackTeamId ? 'Slack workspace' : 'Google account'}
            </dd>
          </div>
          {user.slackTeamId && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Slack team</dt>
              <dd className="font-mono text-xs text-slate-700">{user.slackTeamId}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/brain/connectors" className="card hover:shadow-soft">
          <h3 className="font-semibold text-slate-900">Connections</h3>
          <p className="mt-1 text-sm text-slate-600">Slack workspace, search, and bot status</p>
        </Link>
        <Link href="/audit" className="card hover:shadow-soft">
          <h3 className="font-semibold text-slate-900">Audit log</h3>
          <p className="mt-1 text-sm text-slate-600">What did the AI actually see?</p>
        </Link>
      </div>
    </div>
  );
}

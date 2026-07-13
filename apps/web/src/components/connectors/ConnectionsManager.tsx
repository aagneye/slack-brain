'use client';

import { useCallback, useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import type { SlackConnectionStatus } from '@/lib/connector-status';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';

function SlackMark() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.521V8.834zm-1.271 0a2.527 2.527 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.522 2.522v6.312zm-2.522 10.122a2.528 2.528 0 0 1 2.522 2.521A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.521-2.522v-2.521h2.521zm0-1.271a2.527 2.527 0 0 1-2.521-2.521 2.527 2.527 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z" />
    </svg>
  );
}

export function ConnectionsManager({ initial }: { initial: SlackConnectionStatus }) {
  const { update } = useSession();
  const [status, setStatus] = useState(initial);
  const [searchToken, setSearchToken] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [searchError, setSearchError] = useState(false);
  const [workspaceMessage, setWorkspaceMessage] = useState('');
  const [lastChecked, setLastChecked] = useState(initial.checkedAt);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/connectors/status', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as SlackConnectionStatus;
    setStatus(data);
    setLastChecked(data.checkedAt);
  }, []);

  useEffect(() => {
    const id = window.setInterval(refresh, 12_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function connectSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchBusy(true);
    setSearchMessage('');
    setSearchError(false);
    const res = await fetch('/api/connectors/slack-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: searchToken }),
    });
    const data = await res.json().catch(() => ({}));
    setSearchBusy(false);
    if (!res.ok) {
      setSearchError(true);
      setSearchMessage(data.detail ?? data.error ?? 'Failed to save token');
      return;
    }
    setSearchToken('');
    setSearchMessage('Slack search connected.');
    await refresh();
  }

  async function disconnectSearch() {
    setSearchBusy(true);
    setSearchMessage('');
    setSearchError(false);
    const res = await fetch('/api/connectors/slack-search', { method: 'DELETE' });
    setSearchBusy(false);
    if (!res.ok) {
      setSearchError(true);
      setSearchMessage('Could not disconnect search token');
      return;
    }
    setSearchMessage('Slack search disconnected.');
    await refresh();
  }

  async function disconnectWorkspace() {
    setWorkspaceBusy(true);
    setWorkspaceMessage('');
    // Drop search token while workspace is still linked, then clear team id from session.
    await fetch('/api/connectors/slack-search', { method: 'DELETE' }).catch(() => null);
    await update({ disconnectSlack: true });
    setStatus((prev) => ({
      ...prev,
      workspace: { connected: false, slackTeamId: null, name: null },
      slackSearch: { connected: false },
      checkedAt: new Date().toISOString(),
    }));
    setLastChecked(new Date().toISOString());
    setWorkspaceMessage('Slack workspace disconnected.');
    setWorkspaceBusy(false);
    await refresh();
  }

  const checkedLabel = new Date(lastChecked).toLocaleTimeString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Live status · last checked {checkedLabel}
        </p>
        <button type="button" onClick={refresh} className="btn-ghost text-xs">
          Refresh now
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="premium-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4A154B] text-white shadow-md">
                <SlackMark />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">Slack workspace</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Links your company workspace so packs are scoped correctly.
                </p>
              </div>
            </div>
            <ConnectionStatusBadge
              status={status.workspace.connected ? 'connected' : 'disconnected'}
              pulse
            />
          </div>

          {status.workspace.connected ? (
            <dl className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Workspace</dt>
                <dd className="font-medium text-slate-900">
                  {status.workspace.name ?? 'Connected'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Team ID</dt>
                <dd className="font-mono text-xs text-slate-700">{status.workspace.slackTeamId}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Sign in with Slack to link your workspace. Google sign-in alone does not attach a
              Slack team.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {!status.workspace.connected ? (
              <button
                type="button"
                className="btn-accent rounded-2xl"
                onClick={() => signIn('slack', { callbackUrl: '/brain/connectors' })}
              >
                Connect Slack workspace
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-ghost rounded-2xl"
                  onClick={() => signIn('slack', { callbackUrl: '/brain/connectors' })}
                  disabled={workspaceBusy}
                >
                  Reconnect workspace
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  onClick={disconnectWorkspace}
                  disabled={workspaceBusy}
                >
                  {workspaceBusy ? 'Disconnecting…' : 'Disconnect'}
                </button>
              </>
            )}
          </div>
          {workspaceMessage && (
            <p className="mt-3 text-sm text-emerald-600">{workspaceMessage}</p>
          )}
        </article>

        <article className="premium-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Slack message search</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                User token with <code className="text-xs">search:read</code> for retrieval.
              </p>
            </div>
            <ConnectionStatusBadge
              status={
                !status.workspace.connected
                  ? 'disconnected'
                  : status.slackSearch.connected
                    ? 'connected'
                    : 'disconnected'
              }
              pulse={status.workspace.connected}
            />
          </div>

          {!status.workspace.connected ? (
            <p className="mt-4 text-sm text-amber-800">
              Connect your Slack workspace first, then add a search token here.
            </p>
          ) : status.slackSearch.connected ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-slate-600">
                Your user search token is saved. Context Packs can search messages you are allowed to
                read.
              </p>
              <button
                type="button"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                onClick={disconnectSearch}
                disabled={searchBusy}
              >
                {searchBusy ? 'Disconnecting…' : 'Disconnect search'}
              </button>
            </div>
          ) : (
            <form onSubmit={connectSearch} className="mt-5 space-y-3">
              <p className="text-xs text-slate-500">
                Paste a <strong>user token</strong> (<code>xoxp-</code>). Bot tokens cannot search.
              </p>
              <input
                type="password"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                placeholder="xoxp-..."
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm outline-none ring-indigo-200 focus:ring-2"
              />
              <button
                type="submit"
                disabled={searchBusy || searchToken.length < 10}
                className="btn-accent rounded-2xl disabled:opacity-50"
              >
                {searchBusy ? 'Connecting…' : 'Connect search token'}
              </button>
            </form>
          )}

          {searchMessage && (
            <p className={`mt-3 text-sm ${searchError ? 'text-red-600' : 'text-emerald-600'}`}>
              {searchMessage}
            </p>
          )}
        </article>

        <article className="premium-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Slack bot</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Posts <code className="text-xs">/slackbrain</code> replies and Pack cards.
              </p>
            </div>
            <ConnectionStatusBadge
              status={status.slackBot.installed ? 'connected' : 'disconnected'}
              pulse
            />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {status.slackBot.installed
              ? 'Bot token is configured on the server. Your workspace admin installed the Slack app.'
              : 'Not installed yet. Ask an admin to add the Slack Brain app to your workspace.'}
          </p>
        </article>
      </div>
    </div>
  );
}

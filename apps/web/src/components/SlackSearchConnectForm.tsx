'use client';

import { useState } from 'react';

export function SlackSearchConnectForm() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setMessage('');
    const res = await fetch('/api/connectors/slack-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus('error');
      setMessage(data.detail ?? data.error ?? 'Failed to save token');
      return;
    }
    setStatus('ok');
    setMessage('Slack search token saved for your user.');
    setToken('');
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
      <p className="text-xs text-neutral-500">
        Paste a <strong>user token</strong> (<code>xoxp-</code>) with <code>search:read</code>. Bot
        tokens (<code>xoxb-</code>) cannot search Slack.
      </p>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="xoxp-..."
        className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
      />
      <button
        type="submit"
        disabled={status === 'saving' || token.length < 10}
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {status === 'saving' ? 'Saving…' : 'Connect search token'}
      </button>
      {message && (
        <p className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}

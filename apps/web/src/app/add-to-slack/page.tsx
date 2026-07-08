'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

const PROD_REDIRECT = 'https://slackbrain.vercel.app/api/auth/callback/slack';
const LOCAL_REDIRECT = 'http://localhost:3000/api/auth/callback/slack';

/**
 * Workspace admins land here from the admin guide "Add to Slack" link.
 * Shows required Slack Redirect URLs, then starts Sign in with Slack.
 */
export default function AddToSlackPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
      signIn('slack', { callbackUrl: '/brain?slack_installed=1' });
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="premium-shell flex min-h-screen flex-col items-center justify-center px-6">
      <div className="premium-card w-full max-w-lg p-8 text-left shadow-card">
        <p className="text-2xl">🧠</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Add Slack Brain to your workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          {ready
            ? 'Redirecting to Slack…'
            : 'Before Slack can authorize, your app must allow these Redirect URLs.'}
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">If you see “redirect_uri did not match”</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-900">
            <li>
              Open{' '}
              <a
                className="font-medium underline"
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noreferrer"
              >
                api.slack.com/apps
              </a>
            </li>
            <li>Your app → <strong>OAuth & Permissions</strong> → <strong>Redirect URLs</strong></li>
            <li>Add these exactly, then <strong>Save URLs</strong>:</li>
          </ol>
          <ul className="mt-3 space-y-2 font-mono text-xs">
            <li className="rounded-lg bg-white px-3 py-2 break-all">{PROD_REDIRECT}</li>
            <li className="rounded-lg bg-white px-3 py-2 break-all">{LOCAL_REDIRECT}</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-accent"
            onClick={() => signIn('slack', { callbackUrl: '/brain?slack_installed=1' })}
          >
            Continue with Slack now
          </button>
          <Link href="/signup" className="btn-ghost">
            Back to sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

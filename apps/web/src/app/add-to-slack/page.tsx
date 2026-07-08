'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

/** Workspace admins land here to authorize Slack Brain for their workspace. */
export default function AddToSlackPage() {
  useEffect(() => {
    signIn('slack', { callbackUrl: '/brain?slack_installed=1' });
  }, []);

  return (
    <main className="premium-shell flex min-h-screen flex-col items-center justify-center px-6">
      <div className="premium-card w-full max-w-lg p-8 text-center shadow-card">
        <p className="text-2xl">🧠</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Add Slack Brain to your workspace</h1>
        <p className="mt-2 text-sm text-slate-600">Redirecting to Slack…</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-accent"
            onClick={() => signIn('slack', { callbackUrl: '/brain?slack_installed=1' })}
          >
            Continue with Slack
          </button>
          <Link href="/signup" className="btn-ghost">
            Back to sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

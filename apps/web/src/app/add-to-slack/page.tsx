'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

/**
 * Workspace admins land here from the admin guide "Add to Slack" link.
 * Triggers Sign in with Slack, which installs / links the app to their workspace.
 */
export default function AddToSlackPage() {
  useEffect(() => {
    signIn('slack', { callbackUrl: '/brain?slack_installed=1' });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="card max-w-md text-center shadow-card">
        <p className="text-2xl">🧠</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Adding Slack Brain to your workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          Redirecting to Slack so you can approve the app for your company workspace…
        </p>
        <p className="mt-6 text-xs text-slate-500">
          Stuck?{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Continue manually at Sign up
          </Link>
          {' · '}
          <a
            href="https://github.com/aagneye/slack-brain/blob/main/docs/ADD-SLACK-TO-YOUR-WORKSPACE.md"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Admin guide
          </a>
        </p>
      </div>
    </main>
  );
}

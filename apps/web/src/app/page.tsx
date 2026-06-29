import Link from 'next/link';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
        AI Context Verification Engine
      </span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Context Pack Engine</h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
        The bottleneck is no longer the model — it&apos;s context quality. Build a verified,
        deduplicated, contradiction-checked, confidence-scored <strong>Context Pack</strong> before
        any LLM does work.
      </p>

      <div className="mt-8 flex gap-3">
        {session ? (
          <Link href="/dashboard" className="btn-primary">
            Open dashboard
          </Link>
        ) : (
          <Link href="/login" className="btn-primary">
            Sign in with Slack
          </Link>
        )}
        <a href="https://github.com/aagneye/slack-brain" className="btn-ghost">
          View on GitHub
        </a>
      </div>

      <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
        {[
          ['Gather', 'Search Slack, GitHub, Jira and docs in parallel.'],
          ['Verify', 'Remove duplicates, flag stale data, detect gaps & conflicts.'],
          ['Send', 'Hand only the trusted context to Claude, GPT or Cursor.'],
        ].map(([title, body]) => (
          <div key={title} className="card">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

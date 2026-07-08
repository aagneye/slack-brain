import { NewTaskForm } from '@/components/NewTaskForm';
import Link from 'next/link';

export default function BrainstormPage() {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-indigo-600">Brainstorm</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">What should we investigate?</h1>
      <p className="mt-2 text-slate-600">
        Describe a task. The engine gathers, verifies and scores context before you send it to AI.
        You can also use <code className="rounded bg-slate-100 px-1.5">/slackbrain</code> in Slack.
      </p>

      <div className="card mt-8 shadow-soft">
        <NewTaskForm />
      </div>

      <div className="mt-8 card-muted">
        <h2 className="text-sm font-semibold text-slate-900">Example prompts</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• Why did the checkout API fail after last deploy?</li>
          <li>• Summarize open PRs related to authentication</li>
          <li>• What do we know about the Redis outage in #incidents?</li>
        </ul>
        <Link href="/connectors" className="btn-ghost mt-4 text-sm">
          Connect more sources →
        </Link>
      </div>
    </div>
  );
}

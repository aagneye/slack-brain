import Link from 'next/link';
import { NewTaskForm } from '@/components/NewTaskForm';

export default function DashboardPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-2xl font-bold">Build a Context Pack</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Describe a task. The engine gathers, verifies and scores context before you send it to an
          AI. You can also trigger this from Slack with <code>/slackbrain</code>.
        </p>
        <div className="mt-6">
          <NewTaskForm />
        </div>
      </section>

      <aside className="space-y-4">
        <div className="card">
          <h2 className="text-sm font-semibold">How it works</h2>
          <ol className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            <li>1. Gather from connected sources</li>
            <li>2. Rank relevance</li>
            <li>3. Verify (dedupe, gaps, conflicts)</li>
            <li>4. Score confidence</li>
            <li>5. Review &amp; send to AI</li>
          </ol>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold">Connect more sources</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Better coverage = higher confidence.
          </p>
          <Link href="/connectors" className="btn-ghost mt-3 w-full">
            Manage connectors
          </Link>
        </div>
      </aside>
    </div>
  );
}

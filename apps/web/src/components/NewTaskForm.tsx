'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EXAMPLES = [
  'Investigate why the Checkout API is failing',
  'What do I need to know before changing the payments retry logic?',
  'Summarize the recent incidents for the notifications service',
];

export function NewTaskForm() {
  const router = useRouter();
  const [task, setTask] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (task.trim().length < 3) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      if (!res.ok) throw new Error(`Failed to create job (${res.status})`);
      const { jobId } = (await res.json()) as { jobId: string };
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <label htmlFor="task" className="text-sm font-medium">
        Describe the task
      </label>
      <textarea
        id="task"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        rows={3}
        placeholder="Investigate why the Checkout API is failing…"
        className="mt-2 w-full resize-none rounded-lg border border-neutral-300 bg-transparent p-3 text-sm outline-none focus:border-brand dark:border-neutral-700"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setTask(ex)}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:border-brand dark:border-neutral-700 dark:text-neutral-400"
          >
            {ex}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary mt-4 disabled:opacity-50">
        {submitting ? 'Building Context Pack…' : 'Build Context Pack'}
      </button>
    </form>
  );
}

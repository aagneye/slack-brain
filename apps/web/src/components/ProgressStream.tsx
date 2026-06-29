'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StageEvent {
  stage: string;
  detail?: Record<string, unknown>;
}

const STEPS = [
  'understanding',
  'retrieving',
  'ranking',
  'verifying',
  'compressing',
  'scoring',
  'generating',
  'done',
];

export function ProgressStream({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<StageEvent[]>([]);
  const [current, setCurrent] = useState('queued');

  useEffect(() => {
    const es = new EventSource(`/api/jobs/${jobId}/stream`);

    es.addEventListener('stage', (e) => {
      const evt = JSON.parse((e as MessageEvent).data) as StageEvent;
      setCurrent(evt.stage);
      setEvents((prev) => [...prev, evt]);
    });

    es.addEventListener('done', async () => {
      es.close();
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = (await res.json()) as { packSlug?: string | null };
      if (data.packSlug) router.push(`/p/${data.packSlug}`);
    });

    es.onerror = () => es.close();
    return () => es.close();
  }, [jobId, router]);

  const currentIdx = STEPS.indexOf(current);

  return (
    <div className="card">
      <h2 className="font-semibold">Building Context Pack…</h2>
      <ol className="mt-4 space-y-2">
        {STEPS.slice(0, -1).map((step, i) => {
          const done = currentIdx > i || current === 'done';
          const active = currentIdx === i;
          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={
                  done
                    ? 'text-green-500'
                    : active
                      ? 'animate-pulse text-brand'
                      : 'text-neutral-400'
                }
              >
                {done ? '●' : active ? '◐' : '○'}
              </span>
              <span className="capitalize">{step}</span>
            </li>
          );
        })}
      </ol>

      {events.length > 0 && (
        <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-neutral-100 p-3 text-xs dark:bg-neutral-800">
          {events
            .filter((e) => e.detail)
            .map((e, i) => `${e.stage}: ${JSON.stringify(e.detail)}`)
            .join('\n')}
        </pre>
      )}
    </div>
  );
}

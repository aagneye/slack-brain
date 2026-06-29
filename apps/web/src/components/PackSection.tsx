import type { PackItem } from '@cpe/shared';

export function PackSection({ title, items }: { title: string; items: PackItem[] }) {
  const included = items.filter((i) => i.included);
  if (included.length === 0) return null;

  return (
    <section className="card">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title} <span className="text-neutral-400">({included.length})</span>
      </h3>
      <ul className="mt-3 space-y-3">
        {included.map((item) => (
          <li key={item.id} className="border-l-2 border-neutral-200 pl-3 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <a href={item.url} target="_blank" rel="noreferrer" className="font-medium hover:text-brand">
                {item.title}
              </a>
              {item.flags.outdated && (
                <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
                  outdated
                </span>
              )}
              {item.flags.seenCount && item.flags.seenCount > 1 && (
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800">
                  seen {item.flags.seenCount}×
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.summary}</p>
            <p className="mt-1 text-xs text-neutral-400">
              {item.source} · {item.author ?? 'unknown'}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

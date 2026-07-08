'use client';

type Status = 'connected' | 'disconnected' | 'pending' | 'soon';

const styles: Record<Status, string> = {
  connected: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  disconnected: 'bg-slate-100 text-slate-600 ring-slate-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  soon: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const labels: Record<Status, string> = {
  connected: 'Connected',
  disconnected: 'Not connected',
  pending: 'Connecting…',
  soon: 'Coming soon',
};

export function ConnectionStatusBadge({
  status,
  pulse = false,
}: {
  status: Status;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {pulse && status === 'connected' && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {labels[status]}
    </span>
  );
}

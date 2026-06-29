import type { Confidence } from '@cpe/shared';

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const { score, factors } = confidence;
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-full ${color} text-white font-bold`}>
          {score}
        </span>
        <div>
          <p className="font-semibold">Confidence {score}/100</p>
          <p className="text-xs text-neutral-500">{confidence.rationale}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        {Object.entries(factors).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
            <dt className="capitalize text-neutral-500">{k.replace(/([A-Z])/g, ' $1')}</dt>
            <dd className="font-medium">{(Number(v) * 100).toFixed(0)}%</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

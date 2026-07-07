const sources = [
  { name: 'Slack', items: 24, health: 92, color: 'bg-violet-500' },
  { name: 'GitHub', items: 18, health: 88, color: 'bg-slate-800' },
  { name: 'Docs', items: 12, health: 75, color: 'bg-sky-500' },
  { name: 'Jira', items: 0, health: 0, color: 'bg-amber-500', stub: true },
];

export default function KnowledgePage() {
  return (
    <div>
      <p className="text-sm font-medium text-violet-600">Knowledge</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Knowledge map</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Visual overview of connected sources and how they feed into Context Packs. Higher coverage
        means higher confidence scores.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sources.map((s) => (
          <div key={s.name} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${s.color}`} />
                <h2 className="font-semibold text-slate-900">{s.name}</h2>
              </div>
              {s.stub ? (
                <span className="badge bg-amber-100 text-amber-800">Coming soon</span>
              ) : (
                <span className="text-sm text-slate-500">{s.items} items indexed</span>
              )}
            </div>
            {!s.stub && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Retrieval health</span>
                  <span>{s.health}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: `${s.health}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-8">
        <h2 className="font-semibold text-slate-900">How sources connect</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 py-8">
          {sources
            .filter((s) => !s.stub)
            .map((s) => (
              <div
                key={s.name}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm"
              >
                {s.name}
              </div>
            ))}
          <span className="text-slate-300">→</span>
          <div className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white">
            Context Pack
          </div>
          <span className="text-slate-300">→</span>
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
            AI
          </div>
        </div>
      </div>
    </div>
  );
}

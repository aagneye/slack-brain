export function LandingBrainPreview() {
  const nodes = [
    { label: 'Slack threads', x: '12%', y: '20%', color: 'bg-violet-500' },
    { label: 'GitHub PRs', x: '72%', y: '15%', color: 'bg-sky-500' },
    { label: 'Docs', x: '80%', y: '55%', color: 'bg-emerald-500' },
    { label: 'Jira', x: '18%', y: '62%', color: 'bg-amber-500' },
  ];

  return (
    <section id="brain" className="border-y border-slate-100 bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="section-title">Your team&apos;s Brain</h2>
            <p className="section-sub">
              Knowledge maps connect sources into one view. Brainstorm tasks, build Context Packs,
              and send verified context to AI — from Slack or the web.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Cover — team dashboard at a glance
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Brainstorm — trigger Context Packs
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Knowledge — mapped sources &amp; confidence
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Profile &amp; Team — your workspace
              </li>
            </ul>
          </div>
          <div className="card relative min-h-[320px] overflow-hidden shadow-card">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white" />
            <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-slate-900 text-3xl shadow-lg">
              🧠
            </div>
            {nodes.map((n) => (
              <div
                key={n.label}
                className="absolute z-10 flex items-center gap-2 rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                style={{ left: n.x, top: n.y }}
              >
                <span className={`h-2 w-2 rounded-full ${n.color}`} />
                {n.label}
              </div>
            ))}
            <svg className="absolute inset-0 h-full w-full opacity-20" aria-hidden>
              <line x1="50%" y1="50%" x2="20%" y2="25%" stroke="#6366f1" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="78%" y2="20%" stroke="#6366f1" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="82%" y2="58%" stroke="#6366f1" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="22%" y2="65%" stroke="#6366f1" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: '🔍',
    title: 'Gather',
    desc: 'Pull threads, PRs, docs and tickets from connected sources in parallel.',
    color: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    icon: '✓',
    title: 'Verify',
    desc: 'Dedupe, detect stale data, surface contradictions and missing information.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    icon: '📦',
    title: 'Pack',
    desc: 'Compress into a structured Context Pack with confidence score and citations.',
    color: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    icon: '🚀',
    title: 'Send to AI',
    desc: 'Hand off only verified context to Ollama, GPT, Claude or Cursor.',
    color: 'bg-amber-50 text-amber-800 border-amber-100',
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="section-title text-center">Context quality is the bottleneck</h2>
        <p className="section-sub mx-auto text-center">
          Not the model. Slack Brain sits in front of your LLM and prepares trusted context.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className={`card border ${f.color.split(' ').slice(2).join(' ')}`}>
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

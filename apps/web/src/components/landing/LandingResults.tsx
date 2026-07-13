const stats = [
  { value: '4', label: 'pipeline stages — gather, verify, pack, send' },
  { value: '/slackbrain', label: 'slash command live in your workspace' },
  { value: '24/7', label: 'ready whenever the next question lands' },
];

export function LandingResults() {
  return (
    <section id="results" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="landing-eyebrow">Results</p>
        <h2 className="landing-h2 mt-3">Real context, already verified.</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.value} className="border-t border-land-line pt-6">
              <p className="font-display text-4xl font-semibold tracking-tight text-land-ink sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-3 text-sm text-land-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

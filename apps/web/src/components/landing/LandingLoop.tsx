const steps = [
  {
    n: '01',
    label: 'Gather',
    title: 'Connect what you have',
    desc: 'Pull Slack threads, GitHub activity, and docs in parallel — scoped to your workspace.',
  },
  {
    n: '02',
    label: 'Verify',
    title: 'Catch gaps early',
    desc: 'Dedupe, flag stale claims, surface contradictions, and score confidence before anyone prompts.',
  },
  {
    n: '03',
    label: 'Pack',
    title: 'Ship a Context Pack',
    desc: 'Compress evidence into a structured pack with citations your team can review in Slack or the web.',
  },
  {
    n: '04',
    label: 'Send',
    title: 'Hand off to AI',
    desc: 'Send only verified context to Ollama, GPT, Claude, or Cursor — not the raw noise.',
  },
];

export function LandingLoop() {
  return (
    <section id="loop" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="landing-eyebrow">The closed loop</p>
        <h2 className="landing-h2 mt-3 max-w-2xl">
          Most tools stop at a dashboard.
          <br />
          Slack Brain closes the loop.
        </h2>
        <p className="landing-body mt-4 max-w-xl">
          From a Slack slash command to a verified Context Pack and Send-to-AI — one continuous
          path for engineering teams.
        </p>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-land-line bg-white">
          <div className="grid divide-y divide-land-line md:grid-cols-4 md:divide-x md:divide-y-0">
            {steps.map((s) => (
              <div key={s.n} className="p-6 sm:p-8">
                <p className="landing-mono-label">
                  {s.n} / {s.label}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-land-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-land-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

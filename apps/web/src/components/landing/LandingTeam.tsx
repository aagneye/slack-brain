export function LandingTeam() {
  return (
    <section id="team" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="landing-eyebrow">The team</p>
        <h2 className="landing-h2 mt-3">Built for this.</h2>

        <div className="mt-10 max-w-xl">
          <article className="flex gap-5 rounded-3xl border border-land-line bg-white p-5 shadow-soft sm:p-6">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-land-forest text-2xl font-bold text-white"
              aria-hidden
            >
              A
            </div>
            <div>
              <h3 className="text-lg font-semibold text-land-ink">Aagneye</h3>
              <p className="landing-mono-label mt-1">Founder · Full stack</p>
              <p className="mt-3 text-sm leading-relaxed text-land-muted">
                Building Slack Brain — the Context Pack Engine that verifies evidence before AI
                acts. Shipping the web portal, Slack agent, and production deploy for the hackathon
                demo.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

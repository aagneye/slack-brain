import Link from 'next/link';

export function LandingHero({ authed }: { authed: boolean }) {
  return (
    <section className="px-6 pb-16 pt-10 sm:pb-24 sm:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="landing-eyebrow landing-fade-up">Verified context before AI acts</p>
        <h1 className="landing-fade-up-delay mt-6 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-land-ink sm:text-6xl">
          Your team&apos;s context,
          <br />
          <span className="text-land-forest">verified like software.</span>
        </h1>
        <p className="landing-fade-up-delay-2 mx-auto mt-6 max-w-xl landing-body text-[17px]">
          Slack Brain gathers evidence from Slack and your tools, removes duplicates, flags gaps,
          and delivers a confidence-scored Context Pack your team can trust — before any model
          answers.
        </p>
        <div className="landing-fade-up-delay-2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {authed ? (
            <Link href="/brain" className="landing-pill-primary px-8">
              Go to your Brain
            </Link>
          ) : (
            <Link href="/signup" className="landing-pill-primary px-8">
              Sign up free
            </Link>
          )}
          <a href="#loop" className="landing-pill-secondary px-8">
            See how it works
          </a>
        </div>
        <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-land-line bg-white px-3 py-2 text-xs text-land-muted shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-land-forest">
            Live
          </span>
          <span>Works in Slack via</span>
          <code className="rounded bg-land-cream px-1.5 py-0.5 font-mono text-[11px] text-land-ink">
            /slackbrain
          </code>
        </div>
      </div>
    </section>
  );
}

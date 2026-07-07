import Link from 'next/link';

export function LandingHero({ authed }: { authed: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-indigo-50/50 to-white px-6 pb-20 pt-16">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="badge bg-indigo-100 text-indigo-700">Hackathon · Context Pack Engine</p>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Verified context
          <span className="block text-indigo-600">before AI acts</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Slack Brain gathers evidence from Slack, GitHub and docs, removes duplicates, flags gaps,
          and delivers a confidence-scored Context Pack your team can trust.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {authed ? (
            <Link href="/brain" className="btn-primary-lg shadow-soft">
              Go to your Brain →
            </Link>
          ) : (
            <Link href="/signup" className="btn-primary-lg shadow-soft">
              Sign up free — it&apos;s the biggest step
            </Link>
          )}
          <a href="#features" className="btn-ghost px-8 py-4 text-base">
            See how it works
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Sign up with Google or Slack · No credit card
        </p>
      </div>
    </section>
  );
}

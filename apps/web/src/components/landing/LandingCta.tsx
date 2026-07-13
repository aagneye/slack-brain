import Link from 'next/link';

export function LandingCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-20 text-center">
      <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="relative mx-auto max-w-2xl">
        <h2 className="font-sans text-3xl font-bold tracking-tight text-white sm:text-4xl">
          See what Slack Brain finds in your workspace.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-indigo-100">
          Sign up, connect Slack, and run <code className="rounded bg-white/10 px-1.5 py-0.5">/slackbrain</code>{' '}
          in a channel. We&apos;ll build a verified Context Pack you can review and send to AI.
        </p>
        <Link href="/signup" className="landing-pill-light mt-8 inline-flex px-8 shadow-lg">
          Sign up free
        </Link>
        <p className="mt-5 font-mono text-xs text-indigo-100/70">
          slackbrain.vercel.app · Google or Slack sign-in
        </p>
      </div>
    </section>
  );
}

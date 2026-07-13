import Link from 'next/link';

export function LandingCta() {
  return (
    <section className="bg-land-forest px-6 py-20 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-sans text-3xl font-bold tracking-tight text-land-cream sm:text-4xl">
          See what Slack Brain finds in your workspace.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-land-cream/75">
          Sign up, connect Slack, and run <code className="text-land-cream">/slackbrain</code> in a
          channel. We&apos;ll build a verified Context Pack you can review and send to AI.
        </p>
        <Link href="/signup" className="landing-pill-light mt-8 inline-flex px-8">
          Sign up free
        </Link>
        <p className="mt-5 font-mono text-xs text-land-cream/50">
          slackbrain.vercel.app · Google or Slack sign-in
        </p>
      </div>
    </section>
  );
}

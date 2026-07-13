import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-land-deep px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md bg-land-forest text-xs text-white"
            aria-hidden
          >
            🧠
          </span>
          Slack Brain
        </Link>
        <p className="text-center text-xs text-white/45">
          Verified context before AI · Context Pack Engine
        </p>
        <a
          href="https://slackbrain.vercel.app"
          className="font-mono text-xs text-white/45 transition hover:text-white/80"
        >
          slackbrain.vercel.app
        </a>
      </div>
    </footer>
  );
}

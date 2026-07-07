import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            🧠
          </span>
          Slack Brain
        </div>
        <p className="text-sm text-slate-500">
          Context Pack Engine · Verify before you prompt
        </p>
        <Link href="/signup" className="btn-accent">
          Sign up
        </Link>
      </div>
    </footer>
  );
}

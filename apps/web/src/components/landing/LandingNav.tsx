import Link from 'next/link';

export function LandingNav({ authed }: { authed: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white">
            🧠
          </span>
          Slack Brain
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900">
            Features
          </a>
          <a href="#brain" className="hover:text-slate-900">
            Brain
          </a>
          <a href="#team" className="hover:text-slate-900">
            Team
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {authed ? (
            <Link href="/brain" className="btn-primary">
              Open Brain
            </Link>
          ) : (
            <>
              <Link href="/signup" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

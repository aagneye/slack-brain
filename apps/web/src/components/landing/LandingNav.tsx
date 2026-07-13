import Link from 'next/link';
import { LandingMark } from './LandingMark';

export function LandingNav({ authed }: { authed: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
          <LandingMark />
          <span className="text-[15px] tracking-tight">Slack Brain</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-medium text-slate-500 md:flex">
          <a href="#loop" className="transition hover:text-indigo-600">
            The loop
          </a>
          <a href="#audience" className="transition hover:text-indigo-600">
            Who it&apos;s for
          </a>
          <a href="#proof" className="transition hover:text-indigo-600">
            Proof
          </a>
          <a href="#results" className="transition hover:text-indigo-600">
            Results
          </a>
          <a href="#faq" className="transition hover:text-indigo-600">
            FAQ
          </a>
          <a href="#team" className="transition hover:text-indigo-600">
            Team
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {authed ? (
            <Link href="/brain" className="landing-pill-primary text-[13px]">
              Open Brain
            </Link>
          ) : (
            <Link href="/signup" className="landing-pill-primary text-[13px]">
              Sign up free
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

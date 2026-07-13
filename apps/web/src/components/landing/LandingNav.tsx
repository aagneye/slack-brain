import Link from 'next/link';
import { LandingMark } from './LandingMark';

export function LandingNav({ authed }: { authed: boolean }) {
  return (
    <header className="sticky top-0 z-50 bg-land-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-land-forest">
          <LandingMark />
          <span className="text-[15px] tracking-tight">Slack Brain</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-medium text-land-muted md:flex">
          <a href="#loop" className="transition hover:text-land-ink">
            The loop
          </a>
          <a href="#audience" className="transition hover:text-land-ink">
            Who it&apos;s for
          </a>
          <a href="#proof" className="transition hover:text-land-ink">
            Proof
          </a>
          <a href="#results" className="transition hover:text-land-ink">
            Results
          </a>
          <a href="#faq" className="transition hover:text-land-ink">
            FAQ
          </a>
          <a href="#team" className="transition hover:text-land-ink">
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

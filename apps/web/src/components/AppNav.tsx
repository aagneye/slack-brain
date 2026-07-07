import Link from 'next/link';
import { signOut } from '@/auth';

const links = [
  { href: '/brain', label: 'Brain' },
  { href: '/dashboard', label: 'Packs' },
  { href: '/connectors', label: 'Connectors' },
  { href: '/history', label: 'History' },
  { href: '/audit', label: 'Audit' },
];

export function AppNav({ user }: { user?: { name?: string | null } }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/brain" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs text-white">
              🧠
            </span>
            Slack Brain
          </Link>
          <nav className="hidden gap-4 text-sm text-slate-600 sm:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-indigo-600">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{user?.name}</span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button className="btn-ghost px-3 py-1" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

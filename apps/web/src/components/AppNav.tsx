import Link from 'next/link';
import { signOut } from '@/auth';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/connectors', label: 'Connectors' },
  { href: '/history', label: 'History' },
  { href: '/audit', label: 'Audit' },
];

export function AppNav({ user }: { user?: { name?: string | null } }) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Context Pack Engine
          </Link>
          <nav className="hidden gap-4 text-sm text-neutral-600 sm:flex dark:text-neutral-400">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-brand">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-500">{user?.name}</span>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/brain', label: 'Cover', icon: '🏠' },
  { href: '/brain/brainstorm', label: 'Brainstorm', icon: '💡' },
  { href: '/brain/knowledge', label: 'Knowledge', icon: '🗺️' },
  { href: '/brain/team', label: 'Team', icon: '👥' },
  { href: '/brain/profile', label: 'Profile', icon: '👤' },
];

const tools = [
  { href: '/dashboard', label: 'Packs' },
  { href: '/connectors', label: 'Connectors' },
  { href: '/history', label: 'History' },
];

export function BrainNav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="premium-glass m-4 flex w-72 shrink-0 flex-col rounded-3xl">
      <div className="border-b border-white/70 px-5 py-5">
        <Link href="/brain" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
            🧠
          </span>
          Slack Brain
        </Link>
        {userName && (
          <div className="mt-3 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-xs font-medium text-indigo-700">
            Hi, {userName}
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Workspace
        </p>
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              }`}
            >
              <span className={active ? 'opacity-100' : 'opacity-80'}>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
        <p className="mt-6 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Tools
        </p>
        {tools.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-2xl px-3 py-2 text-sm text-slate-600 transition hover:bg-white/80 hover:text-slate-900"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

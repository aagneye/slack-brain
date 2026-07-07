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
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <Link href="/brain" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            🧠
          </span>
          Brain
        </Link>
        {userName && <p className="mt-2 truncate text-xs text-slate-500">Hi, {userName}</p>}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Workspace
        </p>
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
        <p className="mt-6 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tools
        </p>
        {tools.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

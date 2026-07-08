import Link from 'next/link';
import { auth } from '@/auth';
import { getSessionUser } from '@/lib/auth-session';

export default async function BrainCoverPage() {
  const session = await auth();
  const user = getSessionUser(session);

  const cards = [
    {
      id: 'brainstorm',
      title: 'Brainstorm',
      desc: 'Start a new Context Pack from a task description.',
      href: '/brain/brainstorm',
      icon: '⚡',
      accent: 'from-indigo-500 to-violet-500',
    },
    {
      id: 'knowledge',
      title: 'Knowledge map',
      desc: 'See how Slack, GitHub and docs connect to your packs.',
      href: '/brain/knowledge',
      icon: '🧭',
      accent: 'from-violet-500 to-fuchsia-500',
    },
    {
      id: 'team',
      title: 'Your team',
      desc: 'Workspace members and roles.',
      href: '/brain/team',
      icon: '👥',
      accent: 'from-sky-500 to-cyan-500',
    },
    {
      id: 'packs',
      title: 'Context Packs',
      desc: 'View history and open completed packs.',
      href: '/history',
      icon: '📦',
      accent: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="premium-card relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">Brain Cover</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Welcome back, {user.name}</h1>
        <p className="mt-3 max-w-2xl text-indigo-100">
          Your verified context layer is ready. Brainstorm a task, review knowledge sources, or
          trigger <code className="rounded bg-white/10 px-1.5 py-0.5">/slackbrain</code> in Slack.
        </p>
        <Link href="/brain/brainstorm" className="btn mt-6 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50">
          Start brainstorming →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="premium-card group p-5"
          >
            <div className="flex items-start justify-between">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${c.accent} text-lg text-white shadow-md`}
              >
                {c.icon}
              </span>
              <span className="text-sm text-slate-400 transition group-hover:text-slate-700">→</span>
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="premium-card rounded-2xl p-5 text-center">
          <p className="text-3xl font-extrabold text-slate-900">4</p>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Pipeline stages</p>
        </div>
        <div className="premium-card rounded-2xl p-5 text-center">
          <p className="text-3xl font-extrabold text-indigo-600">Slack</p>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Agent connected</p>
        </div>
        <div className="premium-card rounded-2xl p-5 text-center">
          <p className="text-3xl font-extrabold text-emerald-600">AI</p>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Ollama / cloud ready</p>
        </div>
      </div>

      <section className="premium-card rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Slack integration for your company</h2>
            <p className="mt-1 text-sm text-slate-600">
              `/slackbrain` works per Slack workspace. We identify your company by Slack <code>team_id</code> and scope jobs to that workspace.
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Workspace-scoped</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">1. Install app</p>
            <p className="mt-1 text-sm text-slate-700">Workspace admin installs Slack Brain once for your company workspace.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">2. Configure command</p>
            <p className="mt-1 text-sm text-slate-700">Set slash command <code>/slackbrain</code> to your Vercel URL in Slack app settings.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">3. Connect sources</p>
            <p className="mt-1 text-sm text-slate-700">Optional: connect Slack Search and GitHub in Connectors for richer retrieval.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/brain/connectors" className="btn-accent rounded-2xl">Manage connections</Link>
          <Link href="/add-to-slack" className="btn-ghost rounded-2xl">Add Slack Brain to workspace</Link>
        </div>
      </section>
    </div>
  );
}

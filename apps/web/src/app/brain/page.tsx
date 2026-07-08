import Link from 'next/link';
import { auth } from '@/auth';
import { getSessionUser } from '@/lib/auth-session';

export default async function BrainCoverPage() {
  const session = await auth();
  const user = getSessionUser(session);

  const cards = [
    {
      title: 'Brainstorm',
      desc: 'Start a new Context Pack from a task description.',
      href: '/brain/brainstorm',
      icon: '💡',
      accent: 'border-l-indigo-500',
    },
    {
      title: 'Knowledge map',
      desc: 'See how Slack, GitHub and docs connect to your packs.',
      href: '/brain/knowledge',
      icon: '🗺️',
      accent: 'border-l-violet-500',
    },
    {
      title: 'Your team',
      desc: 'Workspace members and roles.',
      href: '/brain/team',
      icon: '👥',
      accent: 'border-l-sky-500',
    },
    {
      title: 'Context Packs',
      desc: 'View history and open completed packs.',
      href: '/history',
      icon: '📦',
      accent: 'border-l-emerald-500',
    },
  ];

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-card">
        <p className="text-sm font-medium text-indigo-100">Brain Cover</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="mt-3 max-w-xl text-indigo-100">
          Your verified context layer is ready. Brainstorm a task, review knowledge sources, or
          trigger <code className="rounded bg-white/10 px-1.5 py-0.5">/slackbrain</code> in Slack.
        </p>
        <Link href="/brain/brainstorm" className="btn mt-6 bg-white text-indigo-700 hover:bg-indigo-50">
          Start brainstorming →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className={`card border-l-4 ${c.accent} transition hover:shadow-soft`}
          >
            <span className="text-2xl">{c.icon}</span>
            <h2 className="mt-3 font-semibold text-slate-900">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card-muted text-center">
          <p className="text-2xl font-bold text-slate-900">4</p>
          <p className="text-xs text-slate-500">Pipeline stages</p>
        </div>
        <div className="card-muted text-center">
          <p className="text-2xl font-bold text-indigo-600">Slack</p>
          <p className="text-xs text-slate-500">Agent connected</p>
        </div>
        <div className="card-muted text-center">
          <p className="text-2xl font-bold text-emerald-600">AI</p>
          <p className="text-xs text-slate-500">Ollama / cloud ready</p>
        </div>
      </div>
    </div>
  );
}

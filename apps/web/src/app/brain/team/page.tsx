const members = [
  { name: 'You', role: 'Owner', status: 'Active', initial: 'Y', color: 'bg-indigo-600' },
  { name: 'Slack Brain Bot', role: 'Agent', status: 'Online', initial: '🤖', color: 'bg-violet-600' },
  { name: 'Invite teammate', role: '—', status: 'Pending', initial: '+', color: 'bg-slate-200 text-slate-600' },
];

export default function BrainTeamPage() {
  return (
    <div>
      <p className="text-sm font-medium text-sky-600">Team</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Your workspace</h1>
      <p className="mt-2 text-slate-600">
        People and agents connected to this Brain. Slack workspace members can sign in and build
        Context Packs together.
      </p>

      <div className="mt-8 space-y-4">
        {members.map((m) => (
          <div key={m.name} className="card flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${m.color}`}
            >
              {m.initial}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">{m.name}</h2>
              <p className="text-sm text-slate-500">{m.role}</p>
            </div>
            <span
              className={`badge ${
                m.status === 'Online'
                  ? 'bg-emerald-100 text-emerald-700'
                  : m.status === 'Active'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {m.status}
            </span>
          </div>
        ))}
      </div>

      <div className="card-muted mt-8">
        <h2 className="font-semibold text-slate-900">Hackathon demo tip</h2>
        <p className="mt-2 text-sm text-slate-600">
          Judges can sign up with Google or Slack, then run{' '}
          <code className="rounded bg-white px-1.5 py-0.5">/contextpack &lt;task&gt;</code> in your
          workspace to see the full agent flow.
        </p>
      </div>
    </div>
  );
}

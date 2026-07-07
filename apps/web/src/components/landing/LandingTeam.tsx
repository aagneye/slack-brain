const team = [
  { name: 'Aagney', role: 'Lead · Full stack', initial: 'A', color: 'bg-indigo-600' },
  { name: 'Team Member', role: 'Slack agent & pipeline', initial: 'S', color: 'bg-violet-600' },
  { name: 'Team Member', role: 'Connectors & LLM gateway', initial: 'C', color: 'bg-sky-600' },
];

export function LandingTeam() {
  return (
    <section id="team" className="px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="section-title">Built for the hackathon</h2>
        <p className="section-sub mx-auto">
          A small team shipping verified context infrastructure — demo-ready for judges.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {team.map((m) => (
            <div key={m.name} className="card text-left shadow-soft">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white ${m.color}`}
              >
                {m.initial}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{m.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

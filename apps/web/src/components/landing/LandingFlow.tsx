import { LandingMark } from './LandingMark';

type FlowCard = {
  id: string;
  kind: string;
  badge: string;
  badgeTone: 'info' | 'warn' | 'fault' | 'acted' | 'queued';
  title: string;
  meta: string;
};

const signals: FlowCard[] = [
  {
    id: 's1',
    kind: 'Slack · #engineering',
    badge: 'THREAD',
    badgeTone: 'info',
    title: 'Deploy debate spans three threads',
    meta: '12 messages · 2hrs',
  },
  {
    id: 's2',
    kind: 'GitHub · payments-api',
    badge: 'PR',
    badgeTone: 'warn',
    title: 'Open PR conflicts with runbook',
    meta: 'PR #418 · stale 4d',
  },
  {
    id: 's3',
    kind: 'Docs · onboarding',
    badge: 'GAP',
    badgeTone: 'fault',
    title: 'Missing owner for Redis failover',
    meta: 'no citation found',
  },
];

const actions: FlowCard[] = [
  {
    id: 'a1',
    kind: 'Context Pack',
    badge: 'READY',
    badgeTone: 'acted',
    title: 'Verified pack scored 0.86',
    meta: '18 sources · 3 contradictions flagged',
  },
  {
    id: 'a2',
    kind: 'Send to AI',
    badge: 'SENT',
    badgeTone: 'acted',
    title: 'Handed off to Ollama / GPT',
    meta: 'Only verified context included',
  },
  {
    id: 'a3',
    kind: 'Audit trail',
    badge: 'LOGGED',
    badgeTone: 'queued',
    title: 'What the model actually saw',
    meta: 'Citations + confidence retained',
  },
];

const badgeClass: Record<FlowCard['badgeTone'], string> = {
  info: 'border-land-line text-land-muted',
  warn: 'border-amber-300 text-amber-700',
  fault: 'border-red-300 text-red-700',
  acted: 'border-emerald-300 text-emerald-700',
  queued: 'border-sky-300 text-sky-700',
};

const dotClass: Record<FlowCard['badgeTone'], string> = {
  info: 'bg-land-muted',
  warn: 'bg-amber-500',
  fault: 'bg-red-500',
  acted: 'bg-emerald-500',
  queued: 'bg-sky-500',
};

function Card({ card }: { card: FlowCard }) {
  return (
    <article className="landing-card relative z-10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass[card.badgeTone]}`} />
          <span className="landing-mono-label">{card.kind}</span>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ${badgeClass[card.badgeTone]}`}
        >
          {card.badge}
        </span>
      </div>
      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-land-ink">{card.title}</h3>
      <p
        className={`mt-2 text-xs ${
          card.badgeTone === 'acted' ? 'font-medium text-emerald-700' : 'text-land-muted'
        }`}
      >
        {card.meta}
      </p>
    </article>
  );
}

/** Hub-and-spoke flow: signals in → Slack Brain → actions out. */
export function LandingFlow() {
  return (
    <section id="flow" className="px-6 pb-20 pt-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div>
            <p className="landing-eyebrow mb-4 text-center lg:text-left">Signals in</p>
            <div className="space-y-3">
              {signals.map((c) => (
                <Card key={c.id} card={c} />
              ))}
            </div>
          </div>

          <div className="relative flex flex-col items-center py-6 lg:py-0">
            <div className="hidden h-px w-16 bg-land-line lg:block" aria-hidden />
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-land-line bg-white shadow-soft">
              <LandingMark className="h-9 w-9 text-base" />
              <span className="mt-1 text-[11px] font-semibold text-land-ink">Slack Brain</span>
            </div>
            <div className="hidden h-px w-16 bg-land-line lg:block" aria-hidden />
          </div>

          <div>
            <p className="landing-eyebrow mb-4 text-center lg:text-right">Actions out</p>
            <div className="space-y-3">
              {actions.map((c) => (
                <Card key={c.id} card={c} />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-land-muted">
          Gather · Verify · Pack · Send
        </p>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';

const audiences = [
  {
    id: 'engineers',
    tab: 'Engineers',
    heading: 'Built for people who ship in Slack.',
    points: [
      {
        title: 'Trigger from where you already work',
        desc: 'Run /slackbrain in a channel and get a verified pack — no context-switching to another tool.',
      },
      {
        title: 'See what the model will see',
        desc: 'Citations, confidence, and contradictions stay attached so you can trust the handoff.',
      },
      {
        title: 'Send to the AI you already use',
        desc: 'Ollama for demos, GPT or Claude when you have keys — same pack, your choice of model.',
      },
    ],
    card: {
      eyebrow: 'Slack Brain · Channel',
      badge: 'BUILDING',
      title: 'Job · payments deploy context',
      body: 'Gathering Slack + GitHub evidence for “what should we know before our next deploy?”',
      checks: [
        { done: true, label: 'Workspace scoped' },
        { done: true, label: 'Duplicates removed' },
        { done: false, label: 'Pack card ready' },
      ],
      footer: 'Confidence · rising',
      meta: 'job 0ad97d6d',
    },
  },
  {
    id: 'leads',
    tab: 'Team leads',
    heading: 'Built for people who own the outcome.',
    points: [
      {
        title: 'One workspace, clear boundaries',
        desc: 'Jobs are scoped by Slack team_id — your company’s context stays in your workspace.',
      },
      {
        title: 'Audit what AI consumed',
        desc: 'Know exactly which messages and docs fed the answer — not a black box.',
      },
      {
        title: 'Optional richer retrieval',
        desc: 'Connect Slack search tokens per user so packs reflect what people can actually read.',
      },
    ],
    card: {
      eyebrow: 'Slack Brain · Pack',
      badge: 'VERIFIED',
      title: 'Pack · onboarding gaps',
      body: '3 contradictions flagged. 2 missing owners. Confidence 0.81.',
      checks: [
        { done: true, label: 'Citations attached' },
        { done: true, label: 'Gaps surfaced' },
        { done: true, label: 'Ready for review' },
      ],
      footer: 'Audit trail on',
      meta: 'pack · live',
    },
  },
  {
    id: 'judges',
    tab: 'Demo & judges',
    heading: 'Built for a live hackathon demo.',
    points: [
      {
        title: 'End-to-end in one channel',
        desc: 'Slash command → progress → Pack card → Send to AI. Judges see the loop close live.',
      },
      {
        title: 'Works without OpenAI credits',
        desc: 'Point production at Ollama (local + tunnel) for compression and Send-to-AI.',
      },
      {
        title: 'Web portal when you need depth',
        desc: 'Brain cover, connections, and pack history for the full walkthrough.',
      },
    ],
    card: {
      eyebrow: 'Slack Brain · Demo',
      badge: 'LIVE',
      title: 'Demo path · Vercel + Render',
      body: 'Webhooks on Vercel. Worker on Render. Ollama for AI. Neon + Upstash underneath.',
      checks: [
        { done: true, label: '/slackbrain ack' },
        { done: true, label: 'Worker health ok' },
        { done: false, label: 'Send to AI' },
      ],
      footer: 'Hackathon ready',
      meta: 'slackbrain.vercel.app',
    },
  },
] as const;

export function LandingAudience() {
  const [active, setActive] = useState<(typeof audiences)[number]['id']>('engineers');
  const current = audiences.find((a) => a.id === active) ?? audiences[0];

  return (
    <section id="audience" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="landing-eyebrow">Who it&apos;s for</p>
        <div className="mt-4 flex flex-wrap gap-6 border-b border-land-line">
          {audiences.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setActive(a.id)}
              className={`pb-3 text-sm font-medium transition ${
                active === a.id
                  ? 'border-b-2 border-land-ink text-land-ink'
                  : 'text-land-muted hover:text-land-ink'
              }`}
            >
              {a.tab}
            </button>
          ))}
        </div>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-2">
          <div>
            <h2 className="landing-h2">{current.heading}</h2>
            <ul className="mt-10 space-y-8">
              {current.points.map((p, i) => (
                <li key={p.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-land-line/60 text-sm font-semibold text-land-ink">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-land-ink">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-land-muted">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-5 text-white shadow-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="landing-mono-label text-white/50">{current.card.eyebrow}</p>
              <span className="rounded-full bg-violet-300 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-950">
                {current.card.badge}
              </span>
            </div>
            <div className="mt-4 rounded-2xl bg-white/5 p-5">
              <p className="landing-mono-label text-white/40">{current.card.title}</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/90">
                {current.card.body}
              </p>
              <ul className="mt-5 space-y-2.5">
                {current.card.checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-sm text-white/80">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                        c.done
                          ? 'border-violet-300 bg-violet-300 text-indigo-950'
                          : 'border-white/30 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-white/45">{current.card.footer}</span>
              <span className="font-mono text-violet-300">{current.card.meta}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

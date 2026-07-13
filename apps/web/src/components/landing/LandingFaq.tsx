const faqs = [
  {
    q: 'Do I need OpenAI credits?',
    a: 'No. For demos you can run Ollama locally, tunnel it with ngrok, and set OLLAMA_* on Vercel and Render.',
  },
  {
    q: 'How do I trigger a Context Pack?',
    a: 'Install the Slack app, then run /slackbrain <your question> in a channel. Or start a job from the Brain dashboard.',
  },
  {
    q: 'Is workspace data mixed with other companies?',
    a: 'No. Every job is scoped by Slack team_id so your workspace stays isolated.',
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <p className="landing-eyebrow">FAQ</p>
        <h2 className="landing-h2 mt-3">Straight answers.</h2>
        <dl className="mt-10 divide-y divide-land-line border-y border-land-line">
          {faqs.map((f) => (
            <div key={f.q} className="py-6">
              <dt className="text-base font-semibold text-land-ink">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-land-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

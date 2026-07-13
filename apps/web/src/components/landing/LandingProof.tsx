export function LandingProof() {
  return (
    <section id="proof" className="bg-land-deep px-6 py-20 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="landing-eyebrow text-white/45">Visibility &amp; proof</p>
          <h2 className="mt-3 font-sans text-3xl font-bold tracking-tight sm:text-4xl">
            Proof your team can read.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            Every pack is measured against what was actually retrieved — so you can show what
            changed, what was missing, and that the answer is still grounded.
          </p>
          <p className="mt-3 text-base leading-relaxed text-white/60">
            Confidence scores, citations, and an audit trail of what the model saw — generated with
            the pack, not after the fact.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <p className="landing-mono-label text-white/40">Verified vs noise · deploy pack</p>
            <span className="font-mono text-sm font-semibold text-land-mint">+0.86 confidence</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">Noise down, signal held.</h3>

          <div className="mt-8 h-40 w-full" aria-hidden>
            <svg viewBox="0 0 400 140" className="h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="proofFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 40 C60 38, 100 55, 140 50 S220 30, 260 45 S340 70, 400 65"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2"
                strokeDasharray="4 6"
              />
              <path
                d="M0 95 C50 90, 90 70, 140 55 S220 25, 280 30 S350 45, 400 35 L400 140 L0 140 Z"
                fill="url(#proofFill)"
              />
              <path
                d="M0 95 C50 90, 90 70, 140 55 S220 25, 280 30 S350 45, 400 35"
                fill="none"
                stroke="#5EEAD4"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-white/45">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-6 border-t border-dashed border-white/40" />
              Raw channel noise
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-6 border-t-2 border-land-mint" />
              Verified Context Pack
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

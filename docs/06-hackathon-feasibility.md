# 06 — 18-Day Hackathon Feasibility & V1 vs Postponed

## Verdict

**Yes — a polished, demo-ready MVP is realistically buildable in 18 days**, *but only if the scope
is deliberately narrowed*. The full vision (12 components × 6 connectors × multi-model) is a quarter
of work, not 18 days. The winning move is to build the **complete loop on a narrow base**: prove that
"verified context before the model" is real, visible, and trustworthy — on **two** strong sources
with **three** verification behaviors — rather than building all six connectors shallowly.

The architecture above is intentionally designed so the narrow MVP and the full product are the
*same system*: connectors and models are adapters behind ports, so V1 is a subset, not a throwaway.

### Why it's feasible
- The **hard, impressive part is the loop**, and the loop is small: Slack trigger → retrieve →
  rank → verify → score → Pack → send. That's demonstrable with two sources.
- **pgvector in Postgres** avoids standing up a separate vector DB — one datastore.
- **Slack Bolt + Block Kit** make the agent UX fast to build and very demo-friendly (live progress
  is genuinely "wow").
- Verification's most credible wins — **dedupe**, **missing-info**, **staleness** — are tractable
  with embeddings + simple rules. They make the product *feel* smart without research-grade ML.

### Why it's risky (and how the plan absorbs it)
- **Slack Real-Time Search API access** is the #1 unknown → validate Day 1; have `search.messages`
  + seeded data fallback.
- **Contradiction detection** is genuinely hard → it's a **stretch**, not a commitment.
- **Latency** across many APIs → narrow to two sources, add concurrency + caching + partial results.
- **Demo fragility** with live APIs → seed a deterministic demo dataset + recorded fallback.

---

## Recommended V1 (build now) vs Postponed (architect for, build later)

### ✅ Version 1 — in the 18-day build (the demo)

| Area | V1 inclusion |
|---|---|
| **Slack Agent** | Slash command, < 3s ack, **live progress** updates, Pack summary card, Send-to-AI buttons |
| **Connectors** | **Slack Real-Time Search + GitHub** (two, done well) behind the MCP/port contract |
| **Ranking** | Hybrid lexical + embedding similarity + recency/entity boosts |
| **Verification** | **Duplicate detection**, **Missing-context detection**, **Staleness flags** |
| **Confidence** | Transparent 0–100 score with explainable factor breakdown |
| **Pack Generator** | Full structured Pack with required sections + 100% source citations |
| **LLM Gateway** | End-to-end **Send to one provider** (Claude *or* GPT), built to support both |
| **Audit & Logging** | Append-only pipeline events (the "what did the AI see?" story) |
| **Web** | Clean Pack page (`/p/[slug]`) + live progress page |
| **Infra** | Docker-compose (pg+pgvector, redis), CI, basic OTel tracing |

### ⏳ Postponed — designed for, not built in V1

| Area | Why postpone |
|---|---|
| **Contradiction detection** | Hard to get high-precision in time; ship as stretch/heuristic. Architecture already includes it (vector-neighbor pairs → judge). |
| **Jira / Confluence / Notion / Deploy / Incident connectors** | Each is a day+ of OAuth + normalization. Port contract makes them drop-in later; seed/mock for demo. |
| **Context compression / abstractive summaries** | Nice for token budgets; V1 can use extractive snippets. |
| **Multi-model parallel send & cost router** | One provider proves the gateway; routing is P2. |
| **Feedback-driven learned ranking** | Needs usage data; capture 👍/👎 in V1, learn later. |
| **Multi-tenant billing, full RBAC, SSO/SCIM, SOC2** | Enterprise phase (P3). |
| **Auto-refresh / proactive Packs, agent-to-agent MCP** | Vision features (P4) — exciting roadmap slide, not MVP. |

---

## Demo narrative (the 90-second story that wins)

1. In Slack: `/slackbrain Investigate why Checkout API is failing`.
2. Bot: *"🧠 Building Context Pack…"* — progress streams: *Slack 12, GitHub 4 … removed 5 duplicates
   … 1 gap found … Confidence 62%.*
3. Pack card appears: top PRs/threads with citations, a **duplicate collapsed** ("seen in 4 places"),
   an **outdated runbook flagged**, and **Missing Information: "no recent deploy record."**
4. Click **"Why 62%?"** → factor breakdown (coverage/agreement/recency/gaps).
5. Click **"Send to Claude"** → verified context only → answer posts in-thread.
6. Open the **web Pack page** + **audit trail**: "here's exactly what the AI saw."

That sequence demonstrates the entire thesis — *the bottleneck is context, and we fixed it* — and is
fully achievable within 18 days at the scope above.

---

## One-line recommendation

Build the **whole loop on two sources with dedupe + gap + staleness + confidence + send + audit**,
make the **live progress and citations beautiful**, and keep **contradiction detection and the other
four connectors as clearly-architected "coming next"** — that is both the most impressive *and* the
most realistic 18-day MVP.

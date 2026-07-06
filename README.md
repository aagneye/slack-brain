# Context Pack Engine — "Slack Brain"

**An AI Context Verification & Readiness Layer.**

> The bottleneck is no longer the model. The bottleneck is **context quality**.
> Context Pack Engine builds a verified, deduplicated, contradiction-checked, confidence-scored
> **Context Pack** *before* any LLM (Claude, GPT, Cursor) does work.

---

## What is this project?

When an engineer asks an AI to *"investigate why the Checkout API is failing,"* the model usually
gets **incomplete, outdated, duplicated, or conflicting** context — and confidently produces a wrong
answer. The failure happens *upstream of the model*.

Context Pack Engine is **not another chatbot**. It is the layer that sits **in front of** LLMs and
prepares trusted context. An engineer triggers it from Slack (or the web portal); the engine gathers
evidence from Slack, GitHub, Jira and docs, ranks it, removes duplicates and stale data, flags
contradictions and gaps, scores its own confidence, and returns a structured **Context Pack** the
engineer can review and *then* hand to the AI of their choice.

```
Task → Gather → Rank → Verify (dedupe / stale / conflicts / gaps) → Compress → Score → Context Pack → Send to AI
```

## How it works

1. **Sign in** to the web portal (**Sign in with Slack**) — this authenticates you and links your
   Slack workspace to the app.
2. **Connect sources** (GitHub today; Jira/docs on the roadmap) on the **Connectors** page with
   scoped OAuth tokens or API keys.
3. **Trigger a Context Pack** — from Slack (`/contextpack <task>`) or the web **Dashboard**.
4. A background **worker** runs the staged pipeline:
   `understand → retrieve (fan-out) → rank → verify → compress → score → generate`.
5. **Watch live progress** — sources searched, duplicates removed, gaps found — in Slack and on the
   web job page (SSE).
6. **Review the Context Pack** — sections with citations, confidence breakdown, contradictions,
   missing information.
7. **Send to AI** — Claude / GPT / Cursor receive *only* the verified context you approved.
8. Every step is written to an **append-only audit log** ("what did the AI actually see?").

## Web portal

The web app is the control plane:

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Sign in with Slack |
| `/dashboard` | Start a new Context Pack job |
| `/connectors` | Connect GitHub and manage integrations |
| `/history` | Past Context Packs |
| `/audit` | Audit trail (admin) |
| `/jobs/[id]` | Live job progress (SSE) |
| `/p/[slug]` | Full Context Pack review + Send to AI |

Slack is the primary *trigger* surface; the web portal is where you authenticate, connect sources,
and review Packs in detail.

## Architecture at a glance

```
apps/
  web/      Next.js (App Router) — portal: auth, connectors, pack review, API routes, Slack endpoints
  worker/   Node + BullMQ — runs the context pipeline asynchronously
packages/
  core/        pure domain logic: ranking, verification, confidence, pack generation (no I/O)
  connectors/  MCP-style adapters: Slack, GitHub, Jira, docs (uniform ConnectorPort)
  llm-gateway/ provider-agnostic send: OpenAI / Anthropic / Cursor
  db/          Prisma schema + repositories (PostgreSQL + pgvector)
  shared/      types, zod schemas, config, logger
  slack-kit/   Slack Block Kit builders (progress + Pack card)
```

- **Datastores:** PostgreSQL + `pgvector` (system of record + embeddings), Redis (queue, cache,
  pub/sub for live progress).
- **Design principle:** hexagonal / ports-and-adapters — connectors and LLM providers are swappable
  adapters behind ports, so the core stays pure and testable.

Full design lives in [`docs/`](docs/):

| Doc | Contents |
|---|---|
| [01-PRD](docs/01-PRD.md) | Product requirements, user stories, functional & non-functional requirements |
| [02-architecture](docs/02-architecture.md) | Database, system/backend/frontend architecture, API design |
| [03-slack-security-structure](docs/03-slack-security-structure.md) | Slack agent flow, security, folder structure |
| [04-roadmap-risks](docs/04-roadmap-risks.md) | Roadmap, MVP scope, risks |
| [05-diagrams](docs/05-diagrams.md) | Sequence and architecture diagrams |
| [06-hackathon-feasibility](docs/06-hackathon-feasibility.md) | 18-day MVP feasibility |

## Tech stack

TypeScript · Next.js · Node.js · Auth.js (Sign in with Slack) · Prisma · PostgreSQL + pgvector ·
Redis + BullMQ · Slack Bolt / Block Kit · MCP · OpenAI + Anthropic · Tailwind CSS.

## Quick start

```bash
git clone https://github.com/aagneye/slack-brain.git
cd slack-brain
npm install
docker compose up -d          # local Postgres (pgvector) + Redis
cp .env.example .env          # fill in — see setup.md
npm run db:push -w @cpe/db
npm run dev                   # web (port 3000) + worker
```

Open http://localhost:3000 → **Sign in with Slack** → **Connectors** → connect GitHub → trigger a
Pack from the dashboard or `/contextpack` in Slack.

## Setup & deployment

- **Local dev:** [setup.md](setup.md) — Slack app, Neon/Docker Postgres, Redis, env vars
- **Deploy (Vercel + Render + Slack URLs):** [docs/DEPLOY-SLACK-VERCEL-RENDER.md](docs/DEPLOY-SLACK-VERCEL-RENDER.md)
- **Production checklist:** [PRODUCTION.md](PRODUCTION.md) — Neon + Upstash + troubleshooting

## Status

Early scaffold — the pipeline stages and connectors are wired end-to-end; individual stages are being
filled in. See [docs/04-roadmap-risks.md](docs/04-roadmap-risks.md).

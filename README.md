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
prepares trusted context. An engineer triggers it from **Slack** (primary) or the **web portal**;
the engine gathers evidence from Slack, GitHub, Jira and docs, ranks it, removes duplicates and stale
data, flags contradictions and gaps, scores its own confidence, and returns a structured **Context
Pack** the engineer can review and *then* hand to the AI of their choice.

```
Task → Gather → Rank → Verify (dedupe / stale / conflicts / gaps) → Compress → Score → Context Pack → Send to AI
```

---

## How users actually use Slack Brain

**Short answer:** Most users never “register” on a website. They use the **Slack bot** in their
company workspace. The web app is for review, connectors, and the Brain UI — not the main entry
point.

### Two surfaces, one product

| Surface | Who uses it | What they do |
|---|---|---|
| **Slack** (primary) | Engineers in a company workspace | Run `/contextpack <task>` in a channel; get progress + Pack card in-thread |
| **Web** (`slackbrain.vercel.app`) | Same people, when they want more detail | Review a Pack, connect GitHub / Slack search, browse Brain UI |

### The Slack-first flow (no website signup required)

This is the intended hackathon demo path:

1. **Your company admin** installs Slack Brain into your Slack workspace (once per company).  
   **[→ Click here: Add Slack Brain to your workspace](docs/ADD-SLACK-TO-YOUR-WORKSPACE.md)**  
   *(Live install button: [slackbrain.vercel.app/add-to-slack](https://slackbrain.vercel.app/add-to-slack))*
2. **Any teammate** opens a channel and runs:

   ```
   /contextpack what do we know about the payments API outage?
   ```

3. Slack sends the command to our server. We identify:
   - **Which company** — Slack `team_id` → one `Workspace` row in the database
   - **Which person asked** — Slack `user_id` → one `AppUser` row under that workspace
4. A background worker builds the Context Pack from **that company’s** connected sources.
5. The bot posts a **Pack card** in the channel with:
   - **View full Pack** → web link (`/p/<slug>`)
   - **Send to AI** → runs the verified context through Ollama / Claude / GPT

**No account form, no password.** If you are in the Slack workspace and the app is installed, you
can use it. First use auto-creates your workspace and user record.

### How companies stay separate (multi-tenant)

Every Slack workspace is a **data boundary**:

```
Slack workspace (Acme Corp)     →  Workspace in DB  →  jobs, packs, connectors, audit
Slack workspace (Other Inc)     →  different Workspace →  completely separate data
```

- Acme’s `/contextpack` jobs only see Acme’s retrieval scope and stored packs.
- Another company’s Slack workspace never shares data with yours.
- Within a company, each job is tied to the **user who ran the command** (`createdBy`), so packs
  and audit events know who triggered what.

That is why we key everything off Slack’s `team_id` + `user_id` — it is already your company and
identity system.

### When do you need the website?

| Goal | Need web login? | Which sign-in? |
|---|---|---|
| Run `/contextpack` in Slack | **No** | — (Slack app install is enough) |
| Open a Pack link from a Slack card | **No** | `/p/<slug>` is a public review page |
| Connect **your** Slack search token (`xoxp-`) for better retrieval | **Yes** | **Sign in with Slack** (links your web session to your workspace) |
| Connect GitHub, view job history, Brain UI | **Yes** | **Sign in with Slack** recommended |
| Demo the Brain UI to a judge without Slack OAuth | Optional | Google works for `/brain` UI only |

### Do you need Google authentication?

**No — not for the core product.** Google is **optional** on `/signup` for convenience (e.g. judges
clicking around the Brain UI). It does **not** replace Slack for the main workflow.

| Sign-in method | Purpose |
|---|---|
| **Slack** (recommended for web) | Links your browser session to your **Slack workspace** (`slackTeamId`). Needed for connectors, workspace-scoped settings, and matching the same identity you use in `/contextpack`. |
| **Google** (optional) | Opens the Brain UI (`/brain`) without going through Slack OAuth. Fine for a UI demo; does **not** auto-link your company’s Slack data unless you also use Slack sign-in. |

**For a real team using Slack Brain:**  
**[Install Slack Brain in your workspace (admin guide)](docs/ADD-SLACK-TO-YOUR-WORKSPACE.md)** → use `/contextpack` in channels.  
Team members who want to connect sources or browse history should **Sign in with Slack** on the website.

### End-to-end diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Acme Corp Slack workspace                                              │
│                                                                         │
│  Engineer:  /contextpack debug checkout failures                        │
│       │                                                                 │
│       ▼                                                                 │
│  Vercel (web API)  ──enqueue──►  Upstash Redis  ──►  Render worker    │
│       │                              │                    │             │
│       │                              │                    ▼             │
│       │                              │              Gather Slack,       │
│       │                              │              GitHub, …          │
│       │                              │                    │             │
│       │                              │                    ▼             │
│       │                              │              Neon Postgres       │
│       │                              │              (Acme workspace     │
│       │                              │               only)              │
│       ▼                              │                    │             │
│  Bot posts Pack card ◄─────────────────┴────────────────────┘             │
│       │                                                                 │
│       ├──► View full Pack  →  slackbrain.vercel.app/p/abc123            │
│       └──► Send to AI      →  answer posted back in Slack thread        │
└─────────────────────────────────────────────────────────────────────────┘

Optional web path (same person, same company):

  slackbrain.vercel.app/signup  →  Sign in with Slack  →  /brain, /connectors
```

### Typical journeys

**Engineer (day to day)**  
Slack only → `/contextpack` → read Pack card → Send to AI → done.

**Engineer (first time, better retrieval)**  
Sign in with Slack on web → Connectors → paste Slack user token (`search:read`) → back to Slack →
`/contextpack` now searches messages you can see.

**Admin / demo**  
**[Add Slack Brain to your Slack workspace](docs/ADD-SLACK-TO-YOUR-WORKSPACE.md)** → invite bot to `#engineering` → run a demo prompt → share Pack link with judges.

---

## How it works (pipeline)

1. **Trigger** — `/contextpack <task>` in Slack or start a job from the web dashboard.
2. **Identify** — resolve company (`team_id`) and user (`user_id`); scope all data to that workspace.
3. **Retrieve** — fan out to Slack search, GitHub, etc. (per connected sources).
4. **Verify** — rank, dedupe, flag stale data, contradictions, and gaps.
5. **Compress & score** — structured Context Pack with confidence breakdown.
6. **Deliver** — Pack card in Slack + permalink on the web; optional Send to AI.
7. **Audit** — append-only log of what was gathered and sent to models.

## Web portal

The web app is the **control plane and review surface** — not where most users start.

| Route | Auth? | Purpose |
|---|---|---|
| `/` | No | Landing page |
| `/signup` | No | Sign in with **Slack** (recommended) or **Google** (optional) |
| `/brain` | Yes | Brain UI — brainstorm, knowledge, team, profile |
| `/connectors` | Slack sign-in best | Connect Slack search token, GitHub |
| `/dashboard` | Yes | Start a Context Pack job from the web |
| `/history` | Yes | Past Context Packs for your workspace |
| `/jobs/[id]` | Yes | Live job progress (SSE) |
| `/p/[slug]` | No | Full Pack review + Send to AI (link from Slack card) |
| `/audit` | Yes | Audit trail (admin) |

**Slack is the primary trigger.** The website is where you authenticate (via Slack), connect sources,
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

TypeScript · Next.js · Node.js · Auth.js (Slack + optional Google) · Prisma · PostgreSQL + pgvector ·
Redis + BullMQ · Slack Bolt / Block Kit · MCP · Ollama / OpenAI / Anthropic · Tailwind CSS.

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

**Local Slack demo:** expose port 3000 with ngrok, point Slack Request URLs at it, then run
`/contextpack <task>` in a channel — see [setup.md](setup.md).

**Local web demo:** open http://localhost:3000 → **Sign in with Slack** → **Connectors** → connect
GitHub → trigger a Pack from the dashboard or Slack.

## Setup & deployment

- **Workspace admins — install in Slack:** [docs/ADD-SLACK-TO-YOUR-WORKSPACE.md](docs/ADD-SLACK-TO-YOUR-WORKSPACE.md) · [Add to Slack](https://slackbrain.vercel.app/add-to-slack)
- **How users use it (Slack vs web):** this README § [How users actually use Slack Brain](#how-users-actually-use-slack-brain)
- **Local dev + production deploy:** [setup.md](setup.md) — Slack app, Neon, Redis, env vars
- **Deploy (Vercel + Render + Slack URLs):** [docs/DEPLOY-SLACK-VERCEL-RENDER.md](docs/DEPLOY-SLACK-VERCEL-RENDER.md)
- **Production checklist:** [PRODUCTION.md](PRODUCTION.md) — Neon + Upstash + troubleshooting

## Status

Early scaffold — the pipeline stages and connectors are wired end-to-end; individual stages are being
filled in. See [docs/04-roadmap-risks.md](docs/04-roadmap-risks.md).

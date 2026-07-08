# Setup Guide — Context Pack Engine

This guide takes a developer from a fresh clone to a fully running local environment, and then to a
deployed app. Work top to bottom; each section lists exactly what to create and which environment
variables it produces.

> **TL;DR checklist**
> - [ ] Node 20+ and npm 10+ installed
> - [ ] Repo cloned, `npm install` run
> - [ ] PostgreSQL with `pgvector` (local Docker **or** Neon)
> - [ ] Redis (local Docker **or** Upstash)
> - [ ] Slack app created + OAuth + slash command + event subscriptions
> - [ ] OpenAI/Anthropic API keys **or** Ollama running locally / on a reachable host
> - [ ] `.env` filled in from `.env.example`
> - [ ] `npm run db:push` then `npm run dev`
> - [ ] (Deploy) Web → **Vercel**, Worker → **Render**, DB → **Neon**, Queue → **Upstash**
> - [ ] (Deploy) Slack Request URLs → **Vercel only** (`https://slackbrain.vercel.app`)
> - [ ] (Deploy) Render worker live → `https://slack-brain.onrender.com/health`
> - [ ] (Demo) `/slackbrain` in a Slack channel → Pack card → Send to AI

**Live production (hackathon demo):**

| Service | URL | Role |
|---|---|---|
| Web + Slack webhooks | `https://slackbrain.vercel.app` | Landing, `/brain`, all Slack Request URLs |
| Worker (background jobs) | `https://slack-brain.onrender.com` | Health only (`/health`) — **do not** point Slack here |
| Database | Neon | `DATABASE_URL` (pooled + `pgbouncer=true`) + `DIRECT_URL` |
| Queue | Upstash | Same `REDIS_URL` on Vercel **and** Render |

> **Important:** Slack always talks to **Vercel**. Render only pulls jobs from Redis and writes to Neon.
> Jump to **[§10 Live demo — Slack Brain in real Slack](#10-live-demo--slack-brain-in-real-slack)** for the judge-ready setup script.

---

## 0. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 (22 recommended) | `node --version` |
| npm | ≥ 10 | this repo uses **npm workspaces** |
| Docker Desktop | latest | only for local Postgres/Redis (skip if using Neon + Upstash) |
| ngrok (or Cloudflare Tunnel) | latest | to expose `localhost` to Slack during development |

```bash
git clone https://github.com/aagneye/slack-brain.git
cd slack-brain
npm install
cp .env.example .env
```

---

## 1. Database — PostgreSQL + pgvector

You need PostgreSQL **with the `pgvector` extension** (used for embeddings: ranking, dedupe,
contradiction candidate selection).

### Option A — Local (Docker, fastest for dev)

The bundled `docker-compose.yml` runs `pgvector/pgvector:pg16` and Redis:

```bash
docker compose up -d
```

This gives you:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cpe?schema=public"
```

### Option B — Neon (recommended for hosted dev/prod)

1. Create a project at https://neon.tech.
2. In the Neon SQL editor, enable the extension once:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. Copy the **pooled** connection string into `DATABASE_URL`. Append `?sslmode=require&pgbouncer=true`
   (the `pgbouncer=true` flag is required for long-running workers on Render).
   Also copy the **direct** (non-pooled) string into `DIRECT_URL` — Prisma migrations need a direct
   connection.

```
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/cpe?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/cpe?sslmode=require"
```

> **Note:** Supabase also provides Postgres + `pgvector` and works the same way — set `DATABASE_URL`
> to the Supabase connection string and enable the `vector` extension. This project defaults to
> **Neon** for new deployments, but either is fine.

### Apply the schema

Prisma CLI runs from `packages/db` and loads env from the **repo root** `.env` (not
`packages/db/.env`). Keep `DATABASE_URL` and `DIRECT_URL` in the root `.env` file.

```bash
npm run db:push -w @cpe/db      # dev: push schema
# or, for migration history:
npm run db:migrate -w @cpe/db
```

---

## 2. Redis (queue + cache + live progress)

Used by BullMQ (job queue), result/embedding caching, and pub/sub that powers the live progress
stream.

### Option A — Local (Docker)

Already started by `docker compose up -d`:

```
REDIS_URL="redis://localhost:6379"
```

### Option B — Upstash (serverless, good for Vercel/Render)

1. Create a Redis database at https://upstash.com.
2. Copy the connection string (use the TLS `rediss://` URL):

```
REDIS_URL="rediss://default:PASSWORD@xxxx.upstash.io:6379"
```

---

## 3. Slack app (auth + agent)

The Slack app does two jobs: **Sign in with Slack** (web login + workspace linking) and the **Slack
Agent** (slash command, progress, Pack card, Send-to-AI buttons).

### 3.1 Create the app

1. Go to https://api.slack.com/apps → **Create New App** → **From scratch**.
2. Name it `Context Pack Engine`, pick your dev workspace.

### 3.2 OAuth & Permissions — two tokens, two jobs

Slack uses **separate tokens** for posting vs searching. Do not put `search:read` on the bot and
expect `search.messages` to work — Slack requires a **user token** (`xoxp-`) for search.

**Bot Token Scopes** (install app → copy `SLACK_BOT_TOKEN` / `xoxb-`):

- `commands` — slash command
- `chat:write` — post + update progress/Pack messages
- `users:read`, `users:read.email` — resolve the requesting user
- `channels:history`, `groups:history` — read thread context when posting (as permitted)

**User Token Scopes** (create a user token with `search:read` → `SLACK_USER_TOKEN` / `xoxp-`):

- `search:read` — `search.messages` (scoped to what **that user** can read)

Ways to obtain a user search token:

1. **Dev:** Slack app → **OAuth & Permissions** → User Token Scopes → add `search:read` →
   **Install to Workspace** → copy the **User OAuth Token** (`xoxp-`) into `SLACK_USER_TOKEN`.
2. **Portal:** After sign-in, open **Connectors** → **Slack Search** → paste your `xoxp-` token
   (stored per user for that workspace).

Set the **Redirect URL** for OAuth:

```
https://<your-tunnel-or-domain>/api/auth/callback/slack
```

### 3.3 Slash command

- **Command:** `/slackbrain`
- **Request URL:** `https://<your-tunnel-or-domain>/api/slack/commands`
- **Short description:** "Ask Slack Brain to gather and verify context for a task"

### 3.4 Interactivity & Shortcuts

- Turn **Interactivity** ON.
- **Request URL:** `https://<your-tunnel-or-domain>/api/slack/interactions`

### 3.5 Event Subscriptions

- Turn ON, **Request URL:** `https://<your-tunnel-or-domain>/api/slack/events`
  (Slack sends a URL-verification challenge; the endpoint answers it.)
- Subscribe to bot events: `app_mention`.

### 3.6 Sign in with Slack (OpenID Connect)

Under **OAuth & Permissions** the User Token Scopes for OIDC are `openid`, `email`, `profile`.
This enables Auth.js "Sign in with Slack" on the web portal.

### 3.7 Copy credentials → `.env`

From **Basic Information** and **OAuth & Permissions**:

```
SLACK_CLIENT_ID="..."
SLACK_CLIENT_SECRET="..."
SLACK_SIGNING_SECRET="..."          # verifies inbound Slack requests
SLACK_BOT_TOKEN="xoxb-..."          # bot only: post/update messages (NOT for search)
SLACK_USER_TOKEN="xoxp-..."         # user token with search:read for message retrieval
```

### 3.8 Expose localhost during development

Slack must reach your machine:

```bash
ngrok http 3000
```

Use the generated `https://....ngrok-free.app` URL in all the Request/Redirect URLs above, and set:

```
APP_BASE_URL="https://....ngrok-free.app"
AUTH_URL="https://....ngrok-free.app"
```

---

## 4. GitHub connector

For the GitHub retrieval connector:

- **Quick (dev):** create a fine-grained **Personal Access Token** (read-only: Contents,
  Pull requests, Issues, Metadata) and set `GITHUB_TOKEN`.
- **Proper (multi-user):** create a **GitHub App** and use per-install tokens (roadmap).

```
GITHUB_TOKEN="github_pat_..."
```

> Jira / Confluence / Notion connectors follow the same pattern (OAuth or API token). They are
> stubbed in V1 — see `docs/04-roadmap-risks.md`.

---

## 5. LLM providers (Ollama or cloud)

The pipeline uses an LLM for **compression summaries** and the **Send to AI** buttons (web + Slack).
For production with Neon + Upstash but **no cloud LLM keys**, use **Ollama**.

### Option A — Ollama (recommended for self-hosted AI)

1. Install Ollama: https://ollama.com
2. Pull models used by the pipeline:

   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

3. Add to `.env`:

   ```
   OLLAMA_ENABLED=true
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_CHAT_MODEL=llama3.2
   OLLAMA_EMBED_MODEL=nomic-embed-text
   EMBEDDINGS_PROVIDER=ollama
   ```

4. Verify:

   ```bash
   npm run check:ollama
   ```

**Production (Vercel web + Render worker):** the worker must reach Ollama over the network.
`localhost:11434` on Render will **not** work — run Ollama on a VPS, tunnel, or sidecar and set:

```
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=https://your-ollama-host:11434
EMBEDDINGS_PROVIDER=ollama
```

Leave `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` empty when Ollama is your only provider.

### Option B — Cloud APIs (OpenAI / Anthropic)

```
OPENAI_API_KEY="sk-..."           # https://platform.openai.com
ANTHROPIC_API_KEY="sk-ant-..."    # https://console.anthropic.com
EMBEDDINGS_PROVIDER="openai"      # used for ranking/dedupe embeddings
```

You can combine Ollama with cloud keys; Ollama is preferred when `OLLAMA_ENABLED=true`.

---

## 6. Auth (web portal sessions)

Sign up at `/signup` supports **Google** and **Slack**. Auth.js needs a secret:

```bash
# generate one:
openssl rand -base64 32
```

```
AUTH_SECRET="<generated>"
AUTH_URL="http://localhost:3000"   # same as APP_BASE_URL in production
```

### Google OAuth (optional but recommended for judges)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create **OAuth 2.0 Client ID** → Web application.
3. Authorized redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://slackbrain.vercel.app/api/auth/callback/google`
4. Copy into `.env`:

```
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
```

Slack sign-in uses the same Slack app credentials from §3 (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`).

---

## 7. Run it locally

```bash
docker compose up -d          # postgres + redis (skip if using Neon/Upstash)
npm run db:push -w @cpe/db     # apply schema
npm run dev                    # runs web (3000) + worker together
```

Open http://localhost:3000 → **Sign in with Slack** → **Connectors** → connect GitHub →
trigger a Context Pack from the dashboard or `/slackbrain` in Slack.

### 7.1 Using Slack Brain inside Slack (local)

Once `npm run dev` is running and Slack Request URLs point at your ngrok URL:

1. In any channel where the bot is installed, run:

   ```
   /slackbrain summarize recent deploy issues for payments service
   ```

2. The bot posts a **progress message**, then a **Context Pack card** when the worker finishes.
3. On the card:
   - **View full Pack** — opens the web portal (`/p/<slug>`).
   - **Ollama (llama3.2)** — sends the Pack to your Ollama model and posts the answer in-thread.
   - **Open in Cursor** — handoff link for IDE workflows.
4. Retrieval uses your **user search token** (`SLACK_USER_TOKEN` or Connectors → Slack Search).
   The bot token only posts messages.

For **production** (Vercel + Render already deployed), skip ngrok and follow **§10** instead.

**Local dev checklist for Slack:**

```bash
ngrok http 3000                    # expose web to Slack
npm run check:redis                # Upstash or local Redis
npm run check:ollama               # Ollama reachable
npm run dev                        # web :3000 + worker
```

Set `APP_BASE_URL` and `AUTH_URL` to your ngrok URL. Re-install the Slack app if URLs change.

---

## 8. Production — where to host what

This project uses **five services** in production. You do **not** put everything on Vercel.

| What | Host | Required? | Why |
|---|---|---|---|
| **Website + API** (landing, `/brain`, Slack webhooks) | **Vercel** | Yes | Next.js serverless; Slack Request URLs point here |
| **Background worker** (Context Pack pipeline) | **Render** | Yes | Long-running BullMQ job consumer — Vercel cannot run this |
| **PostgreSQL** (users, packs, audit) | **Neon** | Yes | Managed Postgres + `pgvector` |
| **Redis** (job queue, pub/sub) | **Upstash** | Yes | Shared queue between Vercel and Render |
| **Ollama** (local AI) | Your VPS / tunnel | If no cloud LLM | Worker calls it over HTTP; not hosted on Vercel/Render |
| **Custom domain** | Vercel Domains + DNS | No | Optional — `https://slackbrain.vercel.app` is enough for the demo |

### Do you need Render?

**Yes**, for a full production demo. Without Render:

- Vercel can receive `/slackbrain` and enqueue jobs to Redis
- **Nothing processes the queue** — jobs stay stuck, no Pack card in Slack

Render runs `apps/worker`, which pulls jobs from Upstash and writes results to Neon.

### What you already have (from your `.env`)

If your `.env` has Neon `DATABASE_URL`, `DIRECT_URL`, and Upstash `REDIS_URL`, you are set for
database and queue. You still need:

1. **Vercel** — deploy web app + import env vars (`https://slackbrain.vercel.app`)
2. **Render** — deploy worker with the **same** env vars
3. **Slack app** — point all Request URLs to your Vercel URL
4. **Secrets** — `AUTH_SECRET`, `GOOGLE_CLIENT_*`, `SLACK_USER_TOKEN`, AI config

### Production setup order (do in this sequence)

```
1. Neon     → DATABASE_URL (pooled + pgbouncer=true) + DIRECT_URL
2. Upstash  → REDIS_URL (same on Vercel and Render)
3. Vercel   → deploy apps/web → https://slackbrain.vercel.app
4. Render   → deploy worker → https://slack-brain.onrender.com/health
5. Slack    → point all 4 Request URLs at Vercel (§10.3)
6. AI       → Ollama host reachable from Render OR cloud LLM keys
7. Smoke    → /api/health, /slackbrain in Slack channel
```

No custom domain needed — use `https://slackbrain.vercel.app` everywhere (`APP_BASE_URL`, `AUTH_URL`, Slack URLs, Google OAuth redirect).

```bash
# Generate Vercel import file from your local .env
npm run env:vercel
# → upload .env.vercel in Vercel → Settings → Environment Variables → Import .env
# → copy same worker vars into Render dashboard (npm run env:render for .env.render)
npm run smoke:prod   # pre-flight check before deploy
```

---
## 8.1 Deployment (Vercel + Render + Slack URLs)

> **Full step-by-step:** [docs/DEPLOY-SLACK-VERCEL-RENDER.md](docs/DEPLOY-SLACK-VERCEL-RENDER.md)  
> **Judge demo runbook:** [docs/HACKATHON-LAUNCH-CHECKLIST.md](docs/HACKATHON-LAUNCH-CHECKLIST.md)

### Slack Request URLs (paste into api.slack.com)

**Use your Vercel URL** — currently `https://slackbrain.vercel.app`:

| Slack setting | Request URL |
|---|---|
| OAuth redirect | `https://slackbrain.vercel.app/api/auth/callback/slack` |
| Slash command `/slackbrain` | `https://slackbrain.vercel.app/api/slack/commands` |
| Interactivity | `https://slackbrain.vercel.app/api/slack/interactions` |
| Event subscriptions | `https://slackbrain.vercel.app/api/slack/events` |

If you add a custom domain later, replace `slackbrain.vercel.app`
in all four URLs and in `APP_BASE_URL` / `AUTH_URL`.

**Import env to Vercel:** run `npm run env:vercel` → upload `.env.vercel` in Vercel → Environment Variables → Import .env (file is gitignored; never commit it).

Verify URLs from your deploy:

```bash
curl https://slackbrain.vercel.app/api/health
# → "status": "ok" and "slack": { "slashCommand": "https://...", ... }
```

Re-install the Slack app after changing URLs. Use `/slackbrain` in a **channel** (not the app DM).

### 8.2 Web portal → Vercel

Production URL: **`https://slackbrain.vercel.app`**

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. **Root Directory:** `apps/web`. Framework: Next.js.
3. Add env vars from [`.env.production.example`](.env.production.example).
4. Set `APP_BASE_URL` and `AUTH_URL` to `https://slackbrain.vercel.app` (no trailing slash).
5. Deploy → confirm `GET /api/health` returns `"status": "ok"`.

`apps/web/vercel.json` configures the monorepo install/build from the repo root.

### 8.3 Worker → Render

The worker is a long-running BullMQ consumer — not suitable for Vercel serverless.

**Worker health check (Render is live):** `https://slack-brain.onrender.com/health` → `{"status":"ok","service":"cpe-worker","queue":"context"}`

**Env vars on Render** (same Neon + Upstash as Vercel, plus worker-specific):

| Variable | On Render |
|---|---|
| `DATABASE_URL` | Neon **pooled** URL with `pgbouncer=true` |
| `DIRECT_URL` | Neon **direct** URL (migrations) |
| `REDIS_URL` | Same as Vercel — **must match exactly** |
| `APP_BASE_URL` | `https://slackbrain.vercel.app` (Pack links in Slack) |
| `SLACK_BOT_TOKEN` | Same as Vercel (`xoxb-...`) |
| `SLACK_USER_TOKEN` | Optional — improves Slack search |
| `GITHUB_TOKEN` | Optional — GitHub retrieval |
| `OLLAMA_ENABLED` | `true` if using Ollama |
| `OLLAMA_BASE_URL` | Remote host reachable from Render (not `localhost`) |
| `OLLAMA_CHAT_MODEL` | `llama3.2` |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text` |
| `EMBEDDINGS_PROVIDER` | `ollama` or `openai` |
| `WORKER_CONCURRENCY` | Optional (default `4`) |

**Not needed on Render:** `AUTH_SECRET`, `GOOGLE_CLIENT_*`, `SLACK_SIGNING_SECRET`, `SLACK_CLIENT_*` (web-only).

**Render dashboard settings:**

| Setting | Value |
|---|---|
| **Type** | Background Worker *(preferred)* or Web Service with health on `PORT` |
| **Build command** | `bash scripts/render-build.sh` |
| **Start command** | `npm run start -w @cpe/worker` |

Worker logs should show:

```
worker production checks passed
worker ready, listening on "context" queue
```

Warnings that are OK for hackathon demo:

- `GITHUB_TOKEN not set` — GitHub retrieval skipped
- `SLACK_USER_TOKEN not set` — add later for Slack message search
- `ollama enabled but unreachable` — fix `OLLAMA_BASE_URL` before Send-to-AI works

### 8.4 Database → Neon (prod)

You already have Neon URLs in `.env`. For production:

- Use the **same** Neon project (or a separate prod branch)
- Run `CREATE EXTENSION IF NOT EXISTS vector;` once in Neon SQL editor
- `DATABASE_URL` = pooled connection (Vercel + Render runtime)
- `DIRECT_URL` = direct connection (Render pre-deploy migrations)

Migrations run automatically on Render deploy (`preDeployCommand` in `render.yaml`).

### 8.5 Custom domain (optional — skip for hackathon)

The default Vercel URL (`https://slackbrain.vercel.app`) is enough. You do **not** need to buy a domain.

If you add one later:

1. Vercel → Project → **Settings** → **Domains** → add your domain
2. Copy DNS records Vercel shows (TXT + A or CNAME) into your DNS provider
3. Wait for verification in Vercel
4. Update `APP_BASE_URL`, `AUTH_URL`, Slack Request URLs, and Google OAuth redirect to the new domain

### 8.6 Post-deploy checklist

- [ ] `GET https://slackbrain.vercel.app/api/health` → `"status": "ok"` + `slack` URLs
- [ ] `GET https://slack-brain.onrender.com/health` → `"status": "ok"`, `"service": "cpe-worker"`
- [ ] Render worker logs: `worker ready, listening on "context" queue`
- [ ] `REDIS_URL` identical on Vercel and Render
- [ ] `DATABASE_URL` on Render includes `pgbouncer=true`
- [ ] All four Slack Request URLs point at **Vercel** (not Render)
- [ ] Slack app reinstalled to workspace after URL changes
- [ ] `/slackbrain demo task` in a Slack **channel** → progress → Pack card

See also **[PRODUCTION.md](PRODUCTION.md)** for troubleshooting.

---

## 10. Live demo — Slack Brain in real Slack

Use this section to finish setup and run the hackathon demo. You can paste **§10.1** into ChatGPT
(or any assistant) and work through the checklist together.

### 10.1 Copy-paste prompt for your AI assistant

```
I am deploying Slack Brain (Context Pack Engine) for a hackathon demo.

Architecture:
- Web + Slack webhooks: Vercel at https://slackbrain.vercel.app
- Background worker: Render at https://slack-brain.onrender.com (health only, NOT for Slack URLs)
- Database: Neon Postgres (DATABASE_URL pooled with pgbouncer=true, DIRECT_URL direct)
- Queue: Upstash Redis (same REDIS_URL on Vercel and Render)

Help me complete these steps one at a time. Ask me for missing values before proceeding.

1. Vercel env vars — confirm these are set for Production:
   APP_BASE_URL, AUTH_URL, AUTH_SECRET, DATABASE_URL, DIRECT_URL, REDIS_URL,
   SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN,
   SLACK_USER_TOKEN (optional), GITHUB_TOKEN (optional),
   OLLAMA_ENABLED + OLLAMA_BASE_URL OR OPENAI_API_KEY / ANTHROPIC_API_KEY

2. Render env vars — same DATABASE_URL, DIRECT_URL, REDIS_URL, SLACK_BOT_TOKEN, APP_BASE_URL,
   OLLAMA_* or cloud LLM keys. Build: bash scripts/render-build.sh. Start: npm run start -w @cpe/worker

3. Slack app at api.slack.com — set these Request URLs to Vercel ONLY:
   OAuth redirect:     https://slackbrain.vercel.app/api/auth/callback/slack
   Slash /slackbrain: https://slackbrain.vercel.app/api/slack/commands
   Interactivity:      https://slackbrain.vercel.app/api/slack/interactions
   Events:             https://slackbrain.vercel.app/api/slack/events
   Then reinstall app to workspace.

4. Verify:
   curl https://slackbrain.vercel.app/api/health
   curl https://slack-brain.onrender.com/health

5. Demo in Slack: in a channel, run:
   /slackbrain what should we know before shipping the payments API change?

Expected: bot posts progress, then a Context Pack card with View Pack + Send to AI buttons.
```

### 10.2 What must be working before the demo

| Check | How to verify | If it fails |
|---|---|---|
| Vercel web | `curl https://slackbrain.vercel.app/api/health` | Redeploy Vercel; fix env vars |
| Render worker | `curl https://slack-brain.onrender.com/health` | Check Render logs; fix `REDIS_URL` / Neon URL |
| Shared queue | Same `REDIS_URL` on both hosts | Copy exact Upstash URL to Vercel + Render |
| Slack slash command | Run `/slackbrain test` in a channel | Update Request URL to Vercel; reinstall app |
| Bot in channel | Invite `@Context Pack Engine` (or your app name) | `/invite @YourApp` in the channel |
| AI (Send to AI button) | Ollama reachable from Render **or** cloud API key | Set remote `OLLAMA_BASE_URL`; not `localhost` |

### 10.3 Configure Slack app (api.slack.com)

> **Workspace admins (no code):** use [docs/ADD-SLACK-TO-YOUR-WORKSPACE.md](docs/ADD-SLACK-TO-YOUR-WORKSPACE.md)  
> or [slackbrain.vercel.app/add-to-slack](https://slackbrain.vercel.app/add-to-slack).  
> The steps below are for **developers** editing the Slack app at api.slack.com.

1. Open your app → **OAuth & Permissions**.
2. **Redirect URL:** `https://slackbrain.vercel.app/api/auth/callback/slack`
3. **Bot Token Scopes:** `commands`, `chat:write`, `users:read`, `users:read.email`,
   `channels:history`, `groups:history`
4. **User Token Scopes:** `search:read` (for message retrieval), `openid`, `email`, `profile` (for sign-in)
5. **Slash Commands** → `/slackbrain` → Request URL:
   `https://slackbrain.vercel.app/api/slack/commands`
6. **Interactivity** ON → Request URL:
   `https://slackbrain.vercel.app/api/slack/interactions`
7. **Event Subscriptions** ON → Request URL:
   `https://slackbrain.vercel.app/api/slack/events` → subscribe to `app_mention`
8. **Install App** → reinstall to workspace (required after URL changes)
9. Copy tokens to Vercel **and** Render:
   - `SLACK_BOT_TOKEN` (`xoxb-...`) — required
   - `SLACK_USER_TOKEN` (`xoxp-...` with `search:read`) — optional but better retrieval

### 10.4 Run the demo in Slack

1. Open a **public or private channel** in your workspace (not a DM with the app).
2. Invite the bot if needed: `/invite @Context Pack Engine`
3. Run:

   ```
   /slackbrain summarize what the team discussed about the Render deploy this week
   ```

4. Watch for:
   - Immediate ack from Vercel (slash command received)
   - Progress updates in the thread
   - **Context Pack card** posted by the worker (via `SLACK_BOT_TOKEN`)
5. Click **View full Pack** → opens `https://slackbrain.vercel.app/p/...`
6. Click **Send to AI** (Ollama or cloud) → answer appears in the Slack thread

**Good demo prompts** (pick one that matches your workspace):

```
/slackbrain what are the open questions about our hackathon demo?
/slackbrain summarize recent #engineering messages about deploy failures
/slackbrain build context for onboarding a new engineer to Slack Brain
```

### 10.5 Optional — web portal for judges

| URL | Purpose |
|---|---|
| `https://slackbrain.vercel.app` | Landing page |
| `https://slackbrain.vercel.app/signup` | Google + Slack sign-in |
| `https://slackbrain.vercel.app/brain` | Brain UI (after sign-in) |

Requires `AUTH_SECRET` on Vercel. Google OAuth needs redirect URI:
`https://slackbrain.vercel.app/api/auth/callback/google`

### 10.6 Still broken? Quick fixes

| Symptom | Fix |
|---|---|
| `/slackbrain` does nothing | Slack URL wrong → must be Vercel; reinstall app |
| Command ack but no Pack card | Worker not running or `REDIS_URL` mismatch → check Render logs |
| `dispatch_failed` in Slack | `SLACK_SIGNING_SECRET` wrong on Vercel |
| Pack card but empty retrieval | Add `SLACK_USER_TOKEN` or connect Slack Search in portal |
| Send to AI fails | `OLLAMA_BASE_URL` must be reachable from Render (use VPS/tunnel, not localhost) |
| `DATABASE_URL missing pgbouncer=true` | Add `&pgbouncer=true` to Neon pooled URL on Render |
| Slack OAuth: `redirect_uri did not match` | Add `https://slackbrain.vercel.app/api/auth/callback/slack` (and local `http://localhost:3000/api/auth/callback/slack`) under **OAuth & Permissions → Redirect URLs**, then **Save URLs** |

---

## 9. Environment variable reference

| Variable | Required | Produced in | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | §1 | Postgres (pooled) connection |
| `DIRECT_URL` | Neon | §1 | Direct connection for migrations |
| `REDIS_URL` | yes | §2 | Queue / cache / pub-sub |
| `SLACK_CLIENT_ID` | yes | §3.7 | OAuth / Sign in with Slack |
| `SLACK_CLIENT_SECRET` | yes | §3.7 | OAuth |
| `SLACK_SIGNING_SECRET` | yes | §3.7 | Verify inbound Slack requests |
| `SLACK_BOT_TOKEN` | yes | §3.7 | Post/update Slack messages (xoxb-) |
| `SLACK_USER_TOKEN` | for search | §3.7 | Slack message search (xoxp-, search:read) |
| `GITHUB_TOKEN` | for GitHub | §4 | GitHub retrieval |
| `OPENAI_API_KEY` | one of | §5 | Cloud LLM + embeddings |
| `ANTHROPIC_API_KEY` | one of | §5 | Cloud LLM |
| `OLLAMA_ENABLED` | Ollama | §5 | `true` in production when using Ollama |
| `OLLAMA_BASE_URL` | Ollama | §5 | Ollama HTTP API (not localhost on Render) |
| `OLLAMA_CHAT_MODEL` | Ollama | §5 | Chat model for compression + Send-to-AI |
| `OLLAMA_EMBED_MODEL` | Ollama | §5 | Embedding model for ranking/dedupe |
| `EMBEDDINGS_PROVIDER` | yes | §5 | `ollama` or `openai` |
| `AUTH_SECRET` | yes | §6 | Session encryption |
| `AUTH_URL` / `APP_BASE_URL` | yes | §3.8/§6 | Public base URL |
| `GOOGLE_CLIENT_ID` | for Google sign-in | §6 | OAuth at `/signup` |
| `GOOGLE_CLIENT_SECRET` | for Google sign-in | §6 | OAuth at `/signup` |

See `.env.example` for the canonical list.

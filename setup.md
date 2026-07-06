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
> - [ ] (Deploy) Web → Vercel, Worker → Render

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

3. Copy the **pooled** connection string into `DATABASE_URL` (append `?sslmode=require`).
   Also copy the **direct** (non-pooled) string into `DIRECT_URL` — Prisma migrations need a direct
   connection.

```
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/cpe?sslmode=require"
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

- **Command:** `/contextpack`
- **Request URL:** `https://<your-tunnel-or-domain>/api/slack/commands`
- **Short description:** "Build a verified Context Pack for a task"

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

Auth.js (NextAuth) needs a secret:

```bash
# generate one:
openssl rand -base64 32
```

```
AUTH_SECRET="<generated>"
AUTH_URL="http://localhost:3000"   # APP_BASE_URL in production
```

---

## 7. Run it locally

```bash
docker compose up -d          # postgres + redis (skip if using Neon/Upstash)
npm run db:push -w @cpe/db     # apply schema
npm run dev                    # runs web (3000) + worker together
```

Open http://localhost:3000 → **Sign in with Slack** → **Connectors** → connect GitHub →
trigger a Context Pack from the dashboard or `/contextpack` in Slack.

### 7.1 Using Slack Brain inside Slack

Once `npm run dev` is running (or production is deployed) and Slack Request URLs point at your app:

1. In any channel where the bot is installed, run:

   ```
   /contextpack summarize recent deploy issues for payments service
   ```

2. The bot posts a **progress message**, then a **Context Pack card** when the worker finishes.
3. On the card:
   - **View full Pack** — opens the web portal (`/p/<slug>`).
   - **Ollama (llama3.2)** — sends the Pack to your Ollama model and posts the answer in-thread.
   - **Open in Cursor** — handoff link for IDE workflows.
4. Retrieval uses your **user search token** (`SLACK_USER_TOKEN` or Connectors → Slack Search).
   The bot token only posts messages.

**Local dev checklist for Slack:**

```bash
ngrok http 3000                    # expose web to Slack
npm run check:redis                # Upstash or local Redis
npm run check:ollama               # Ollama reachable
npm run dev                        # web :3000 + worker
```

Set `APP_BASE_URL` and `AUTH_URL` to your ngrok URL. Re-install the Slack app if URLs change.

---

## 8. Deployment (Vercel + Render + Slack URLs)

> **Step-by-step deploy guide:** **[docs/DEPLOY-SLACK-VERCEL-RENDER.md](docs/DEPLOY-SLACK-VERCEL-RENDER.md)**  
> Full walkthrough: Vercel web, Render worker, and every Slack Request URL.

**Architecture:** Slack webhooks hit **Vercel only**. The **Render worker** processes jobs from Redis.
Neon (DB) and Upstash (Redis) are shared between both.

### 8.1 Slack Request URLs (paste into api.slack.com)

Production domain: **`https://creator.tmi.production`**

| Slack setting | Request URL |
|---|---|
| OAuth redirect | `https://creator.tmi.production/api/auth/callback/slack` |
| Slash command `/contextpack` | `https://creator.tmi.production/api/slack/commands` |
| Interactivity | `https://creator.tmi.production/api/slack/interactions` |
| Event subscriptions | `https://creator.tmi.production/api/slack/events` |

**Import env to Vercel:** run `npm run env:vercel` → upload `.env.vercel` in Vercel → Environment Variables → Import .env (file is gitignored; never commit it).

Verify URLs from your deploy:

```bash
curl https://creator.tmi.production/api/health
# → "slack": { "slashCommand": "https://...", ... }
```

Re-install the Slack app after changing URLs. Use `/contextpack` in a **channel** (not the app DM).

### 8.2 Web portal → Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. **Root Directory:** `apps/web`. Framework: Next.js.
3. Add env vars from [`.env.production.example`](.env.production.example).
4. Set `APP_BASE_URL` and `AUTH_URL` to `https://creator.tmi.production` (no trailing slash).
5. Deploy → confirm `GET /api/health` returns `"status": "ok"`.

`apps/web/vercel.json` configures the monorepo install/build from the repo root.

### 8.3 Worker → Render

The worker is a long-running BullMQ consumer — not suitable for Vercel serverless.

1. **New → Blueprint** on Render (uses [`render.yaml`](render.yaml)) **or** create a Background Worker manually.
2. Set the same `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` as Vercel.
3. Set `APP_BASE_URL` to your **Vercel URL** (Pack links in Slack).
4. Set Ollama vars if not using cloud LLM keys (`OLLAMA_BASE_URL` must be reachable from Render).

Worker logs: `worker ready, listening on "context" queue`.

### 8.4 Database → Neon (prod)

Use a separate Neon project/branch for production; migrations run on Render pre-deploy (`db:migrate:deploy`).

### 8.5 Post-deploy checklist

- [ ] `GET https://YOUR-VERCEL-URL/api/health` → ok + `slack` URLs
- [ ] Render worker running with same `REDIS_URL` as Vercel
- [ ] All four Slack Request URLs updated and app reinstalled
- [ ] Slack events URL verification succeeds
- [ ] `/contextpack test` in a channel → Pack card → Send to Ollama

See also **[PRODUCTION.md](PRODUCTION.md)** for troubleshooting.

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

See `.env.example` for the canonical list.

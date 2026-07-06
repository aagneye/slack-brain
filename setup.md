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
> - [ ] OpenAI and/or Anthropic API keys
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

## 5. LLM providers (the gateway)

At least one is required to use "Send to AI".

```
OPENAI_API_KEY="sk-..."           # https://platform.openai.com
ANTHROPIC_API_KEY="sk-ant-..."    # https://console.anthropic.com
EMBEDDINGS_PROVIDER="openai"      # used for ranking/dedupe embeddings
```

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

---

## 8. Deployment

> **Full production checklist:** see **[PRODUCTION.md](../PRODUCTION.md)** — Vercel, Render, Neon,
> Upstash, env vars, Slack URL updates, and smoke tests.

### 8.1 Web portal → Vercel

1. Import the GitHub repo into Vercel.
2. **Root directory:** `apps/web`. Framework preset: Next.js.
3. Add all env vars from `.env` (use Neon + Upstash URLs, not local Docker ones).
4. Set `AUTH_URL` / `APP_BASE_URL` to the Vercel production URL.
5. Update every Slack Request/Redirect URL to the Vercel domain.

### 8.2 Worker → Render

The worker is a long-running background process (not serverless), so it lives on Render.

1. New → **Background Worker** (or Web Service) from the repo.
2. **Build:** `npm install && npm run build -w @cpe/worker`
3. **Start:** `npm run start -w @cpe/worker`
4. Add the same `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, connector + LLM keys.
5. Point it at the **same Neon DB and Upstash Redis** as the web app.

A `render.yaml` blueprint is included in the repo root for reference.

### 8.3 Database → Neon (prod)

Use a separate Neon project/branch for production; run `npm run db:migrate:deploy` in CI or as a
Render pre-deploy step.

### 8.4 Post-deploy checklist

- Re-install the Slack app pointing at production URLs.
- Verify the Slack URL-verification challenge succeeds on `/api/slack/events`.
- Smoke test: `/contextpack test` → progress → Pack → Send to AI.

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
| `OPENAI_API_KEY` | one of | §5 | LLM + embeddings |
| `ANTHROPIC_API_KEY` | one of | §5 | LLM |
| `EMBEDDINGS_PROVIDER` | yes | §5 | Which provider for embeddings |
| `AUTH_SECRET` | yes | §6 | Session encryption |
| `AUTH_URL` / `APP_BASE_URL` | yes | §3.8/§6 | Public base URL |

See `.env.example` for the canonical list.

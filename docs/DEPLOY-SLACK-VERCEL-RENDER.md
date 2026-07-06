# Deploy Slack Brain — Vercel + Render + Slack Request URLs

This guide walks you from a GitHub repo to a live Slack app. **All Slack Request URLs point at Vercel.**
The **Render worker** runs the pipeline in the background — it does **not** receive Slack webhooks.

```
Slack  ──POST──►  Vercel (apps/web)     ──enqueue──►  Upstash Redis
                      │                                      │
                      │  /api/slack/commands                 ▼
                      │  /api/slack/events            Render worker
                      │  /api/slack/interactions            │
                      ▼                                      ▼
                   Neon Postgres  ◄──────────────────────────┘
```

Replace `YOUR-VERCEL-URL` below with your real domain, e.g. `slack-brain.vercel.app` or a custom domain.

---

## Prerequisites

- [ ] Code pushed to GitHub: `https://github.com/aagneye/slack-brain`
- [ ] [Neon](https://neon.tech) Postgres with `CREATE EXTENSION vector;`
- [ ] [Upstash](https://upstash.com) Redis (`rediss://` URL)
- [ ] Slack app created at [api.slack.com/apps](https://api.slack.com/apps)
- [ ] Ollama host reachable from Render **or** OpenAI/Anthropic API keys

---

## Step 1 — Deploy the web app on Vercel

Vercel hosts the Next.js app **and** every Slack webhook route.

1. Go to [vercel.com/new](https://vercel.com/new) → **Import** your GitHub repo.
2. Configure the project:

   | Setting | Value |
   |---|---|
   | **Root Directory** | `apps/web` |
   | **Framework** | Next.js (auto-detected) |
   | **Build Command** | *(leave default — `vercel.json` runs monorepo build)* |
   | **Install Command** | *(leave default)* |

3. Add **Environment Variables** (Production). Copy from [`.env.production.example`](../.env.production.example):

   | Variable | Example / notes |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_BASE_URL` | `https://YOUR-VERCEL-URL` — **no trailing slash** |
   | `AUTH_URL` | same as `APP_BASE_URL` |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_URL` | Neon **direct** URL |
   | `REDIS_URL` | Upstash `rediss://…` |
   | `SLACK_CLIENT_ID` | Slack app |
   | `SLACK_CLIENT_SECRET` | Slack app |
   | `SLACK_SIGNING_SECRET` | Slack app → Basic Information |
   | `SLACK_BOT_TOKEN` | `xoxb-…` — posts Pack cards |
   | `SLACK_USER_TOKEN` | `xoxp-…` with `search:read` — retrieval |
   | `GITHUB_TOKEN` | GitHub PAT |
   | `OLLAMA_ENABLED` | `true` (if using Ollama) |
   | `OLLAMA_BASE_URL` | your Ollama host (not `localhost` on Vercel) |
   | `OLLAMA_CHAT_MODEL` | `llama3.2` |
   | `OLLAMA_EMBED_MODEL` | `nomic-embed-text` |
   | `EMBEDDINGS_PROVIDER` | `ollama` or `openai` |

4. Click **Deploy**. Wait for the build to finish.
5. Smoke test:

   ```bash
   curl https://YOUR-VERCEL-URL/api/health
   ```

   Expect `"status": "ok"` and a `slack` object with your webhook URLs:

   ```json
   {
     "status": "ok",
     "slack": {
       "oauthRedirect": "https://YOUR-VERCEL-URL/api/auth/callback/slack",
       "slashCommand": "https://YOUR-VERCEL-URL/api/slack/commands",
       "interactions": "https://YOUR-VERCEL-URL/api/slack/interactions",
       "events": "https://YOUR-VERCEL-URL/api/slack/events"
     }
   }
   ```

---

## Step 2 — Deploy the worker on Render

The worker consumes jobs from Redis and runs the Context Pack pipeline. **Slack never talks to Render directly.**

### Option A — Blueprint (recommended)

1. Go to [render.com](https://render.com) → **New** → **Blueprint**.
2. Connect the same GitHub repo. Render reads [`render.yaml`](../render.yaml).
3. When prompted, set secret env vars (same Neon + Upstash URLs as Vercel).
4. Set `APP_BASE_URL` to your **Vercel URL** (used for Pack links in Slack messages).

### Option B — Manual worker

| Setting | Value |
|---|---|
| **Type** | Background Worker |
| **Build** | `npm ci && npm run db:generate -w @cpe/db && npm run build -w @cpe/worker` |
| **Pre-deploy** | `npm run db:migrate:deploy -w @cpe/db` |
| **Start** | `npm run start -w @cpe/worker` |

**Render env vars** (must match Vercel for shared infra):

- `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`
- `SLACK_BOT_TOKEN`, `SLACK_USER_TOKEN`
- `GITHUB_TOKEN`
- `APP_BASE_URL` → `https://YOUR-VERCEL-URL`
- `OLLAMA_ENABLED`, `OLLAMA_BASE_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`, `EMBEDDINGS_PROVIDER`

Worker logs should show:

```
worker production checks passed
ollama ready
worker ready, listening on "context" queue
```

> **Ollama on Render:** `OLLAMA_BASE_URL` must be a host the Render worker can reach over the network (VPS, tunnel, etc.). `http://localhost:11434` will not work on Render.

---

## Step 3 — Configure Slack Request URLs (Vercel only)

Open [api.slack.com/apps](https://api.slack.com/apps) → your **slack brain** app.

Copy these URLs exactly (replace `YOUR-VERCEL-URL`):

| Slack setting | Location in Slack app | Request URL |
|---|---|---|
| **OAuth redirect** | OAuth & Permissions → Redirect URLs | `https://YOUR-VERCEL-URL/api/auth/callback/slack` |
| **Slash command** | Slash Commands → `/contextpack` → Request URL | `https://YOUR-VERCEL-URL/api/slack/commands` |
| **Interactivity** | Interactivity & Shortcuts → Request URL | `https://YOUR-VERCEL-URL/api/slack/interactions` |
| **Event subscriptions** | Event Subscriptions → Request URL | `https://YOUR-VERCEL-URL/api/slack/events` |

### Slash command details

- **Command:** `/contextpack`
- **Short description:** Build a verified Context Pack for a task
- **Usage hint:** `[what you want to investigate]`

### Event subscriptions

- Turn **ON**
- Subscribe to bot event: `app_mention`
- Slack sends a URL verification challenge to `/api/slack/events` — should succeed automatically if Vercel is live

### After changing URLs

1. **Save** each Slack settings page.
2. **Reinstall the app** to your workspace (OAuth & Permissions → Reinstall to Workspace).
3. Invite the bot to a channel: `/invite @slack brain`

---

## Step 4 — Test in Slack

Use a **channel**, not a DM with the app.

```
/contextpack summarize recent deploy issues
```

Expected flow:

1. Ephemeral reply: “Building Context Pack…”
2. Worker picks up job from Redis (check Render logs)
3. Bot posts a **Context Pack card** in the channel
4. Click **Ollama** or **View full Pack**

If `/contextpack` is missing:

- App not installed to workspace
- Slash command Request URL wrong or Vercel deploy failed
- `SLACK_SIGNING_SECRET` mismatch on Vercel

If jobs never complete:

- Render worker not running
- `REDIS_URL` different between Vercel and Render
- Check Render logs for errors

---

## Quick reference — who hosts what

| Component | Host | Slack touches it? |
|---|---|---|
| Web + `/api/slack/*` | **Vercel** | Yes — all Request URLs |
| Background pipeline | **Render** | No |
| Postgres | **Neon** | No |
| Job queue | **Upstash** | No |
| Ollama | Your VPS / local tunnel | No (worker calls it) |

---

## Related docs

- [setup.md](../setup.md) — local dev + Slack app creation
- [PRODUCTION.md](../PRODUCTION.md) — production checklist and troubleshooting
- [`.env.production.example`](../.env.production.example) — env var template

# Production Deployment Guide

Step-by-step checklist to take Context Pack Engine from local dev to a live deployment.

**Architecture in production**

| Component | Host | Why |
|---|---|---|
| Web portal + Slack API routes | **Vercel** | Serverless Next.js, global edge, easy Slack webhooks |
| Background worker (pipeline) | **Render** | Long-running BullMQ consumer — not suitable for serverless |
| PostgreSQL + pgvector | **Neon** | Managed Postgres with `vector` extension |
| Redis (queue + pub/sub) | **Upstash** | Serverless Redis, works from Vercel + Render |

---

## Pre-flight checklist

- [ ] Code pushed to GitHub (`https://github.com/aagneye/slack-brain`)
- [ ] Neon project created with `CREATE EXTENSION vector;`
- [ ] Upstash Redis created
- [ ] Slack app created (see [setup.md](setup.md) §3)
- [ ] OpenAI and/or Anthropic API key
- [ ] GitHub PAT for the connector

---

## Step 1 — Database (Neon)

1. Create a Neon project at https://neon.tech
2. Run once in the SQL editor:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

3. Copy **pooled** → `DATABASE_URL` and **direct** → `DIRECT_URL`

Migrations run automatically on Render worker deploy (`preDeployCommand`). To run manually:

```bash
DATABASE_URL="..." DIRECT_URL="..." npm run db:migrate:deploy
```

---

## Step 2 — Redis (Upstash)

1. Create a database at https://upstash.com
2. Copy the **TLS** connection string (`rediss://...`) into `REDIS_URL`
3. Use the **same** Redis URL on both Vercel and Render

---

## Step 3 — Web app (Vercel)

1. Import the repo at https://vercel.com/new
2. **Root Directory:** `apps/web`
3. Framework: Next.js (auto-detected)
4. `vercel.json` already configures monorepo install/build from the repo root
5. Add environment variables from [`.env.production.example`](.env.production.example):

   | Variable | Required on Vercel |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_BASE_URL` | your `https://….vercel.app` |
   | `AUTH_URL` | same as `APP_BASE_URL` |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `DATABASE_URL` | Neon pooled URL |
   | `DIRECT_URL` | Neon direct URL |
   | `REDIS_URL` | Upstash `rediss://` URL |
   | `SLACK_CLIENT_ID` | Slack app |
   | `SLACK_CLIENT_SECRET` | Slack app |
   | `SLACK_SIGNING_SECRET` | Slack app |
   | `SLACK_BOT_TOKEN` | Slack app | Bot token (`xoxb-`) — post Pack cards, not search |
   | `SLACK_USER_TOKEN` | Slack user OAuth | User token (`xoxp-`) with `search:read` for retrieval |
   | `GITHUB_TOKEN` | GitHub PAT |
   | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | at least one |
   | `EMBEDDINGS_PROVIDER` | `openai` |

6. Deploy. Verify: `GET https://your-app.vercel.app/api/health` → `{ "status": "ok" }`

---

## Step 4 — Worker (Render)

1. New **Blueprint** or **Background Worker** from the same GitHub repo
2. Use [`render.yaml`](render.yaml) or configure manually:
   - **Build:** `npm ci && npm run db:generate -w @cpe/db && npm run build -w @cpe/worker`
   - **Pre-deploy:** `npm run db:migrate:deploy -w @cpe/db`
   - **Start:** `npm run start -w @cpe/worker`
3. Add the same `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, connector + LLM keys
4. Set `APP_BASE_URL` to your Vercel URL (used when posting Pack links back to Slack)
5. Deploy — worker logs should show `worker production checks passed` then `worker ready`

---

## Step 5 — Slack app URLs (production)

Update every Slack app URL to your **Vercel** domain:

| Setting | URL |
|---|---|
| OAuth redirect | `https://your-app.vercel.app/api/auth/callback/slack` |
| Slash command | `https://your-app.vercel.app/api/slack/commands` |
| Interactivity | `https://your-app.vercel.app/api/slack/interactions` |
| Event subscriptions | `https://your-app.vercel.app/api/slack/events` |

Re-install the app to your workspace after changing URLs.

---

## Step 6 — Smoke test

1. Open `https://your-app.vercel.app` → Sign in with Slack
2. Connectors → confirm GitHub token works
3. Dashboard → start a Context Pack job → watch `/jobs/[id]` progress
4. In Slack: `/contextpack test task` → progress → Pack card
5. Click **Send to Claude/GPT** → answer in thread
6. Check `/audit` for the logged send

---

## Health & monitoring

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Vercel uptime / deploy verification (DB + Redis + config) |

Production startup validation:

- **Web** — `instrumentation.ts` asserts required env vars when `NODE_ENV=production`
- **Worker** — `validateWorkerProductionEnv()` checks env + DB + Redis before consuming jobs

---

## CI / migrations

- **CI** (`.github/workflows/ci.yml`) — typecheck, test, build on every push
- **Migrate** (`.github/workflows/deploy-migrate.yml`) — manual workflow to run `prisma migrate deploy` against production Neon (optional; Render pre-deploy also runs migrations)

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/health` → `degraded` / DB error | Check `DATABASE_URL`, Neon IP allowlist, `vector` extension |
| `/api/health` → Redis error | Use Upstash `rediss://` URL; same URL on Vercel + Render |
| Sign-in redirects fail | Set `AUTH_URL` and `APP_BASE_URL` to exact Vercel URL; enable `trustHost` (already in code) |
| Slack URL verification fails | Ensure `/api/slack/events` is public; check `SLACK_SIGNING_SECRET` |
| Jobs stuck in queue | Render worker running? Same `REDIS_URL` as Vercel? Check worker logs |
| Worker deploy fails on migrate | Set `DIRECT_URL` on Render; verify Neon direct connection |

---

## Security notes

- Never commit `.env` or production secrets
- Use separate Neon branch/project for staging vs production
- Rotate `AUTH_SECRET` and Slack tokens if leaked
- `SLACK_SIGNING_SECRET` verifies all inbound Slack requests — required on Vercel

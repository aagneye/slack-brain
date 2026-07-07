# Hackathon Launch Checklist (Judge Demo)

Use this as a practical runbook to take Slack Brain live and share one working link with judges.

---

## 1) What "live" means

By the end, you should have:

- A public web URL (for example: `https://creator.tmi.production`)
- Slack app webhooks connected to that URL
- Worker running in Render
- Neon + Upstash connected
- One demo command working in Slack: `/contextpack ...`

---

## 2) Required services (quick)

- **Web app:** Vercel (`apps/web`)
- **Worker:** Render background worker
- **Database:** Neon Postgres (`DATABASE_URL` + `DIRECT_URL`)
- **Queue/Cache:** Upstash Redis (`REDIS_URL`)
- **Slack app:** slash command + interactions + events
- **AI:** Ollama host or OpenAI/Anthropic key

---

## 3) Prepare environment variables

You already have most values in local `.env`.

### Generate import file for Vercel

From repo root:

```bash
npm run env:vercel
```

This creates `.env.vercel` (gitignored) for easy import.

### Must be set before production works

- `APP_BASE_URL=https://creator.tmi.production`
- `AUTH_URL=https://creator.tmi.production`
- `AUTH_SECRET=<generate with openssl rand -base64 32>`
- `DATABASE_URL=<Neon pooled URL>`
- `DIRECT_URL=<Neon direct URL>`
- `REDIS_URL=<Upstash URL>`
- `SLACK_CLIENT_ID`
- `SLACK_CLIENT_SECRET`
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `SLACK_USER_TOKEN` (xoxp with `search:read`, needed for Slack search retrieval)
- `GITHUB_TOKEN` (optional but recommended for demo depth)
- **AI option A (Ollama):** `OLLAMA_ENABLED=true`, `OLLAMA_BASE_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`, `EMBEDDINGS_PROVIDER=ollama`
- **AI option B (cloud):** `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

---

## 4) Deploy web app (Vercel)

1. Import GitHub repo into Vercel.
2. Set **Root Directory** to `apps/web`.
3. In Vercel project settings, import `.env.vercel`.
4. Add custom domain `creator.tmi.production`.
5. Deploy.

### If your domain is managed in Google (Cloud DNS / Google Domains)

Use this when your DNS is in Google and you want the domain live on Vercel.

1. In **Vercel**:
   - Project -> **Settings** -> **Domains**
   - Add `creator.tmi.production` (or your real domain)
   - Copy the DNS records Vercel asks for (usually TXT verification + A/CNAME)

2. In **Google Console** (Cloud DNS zone for your domain):
   - Add the exact DNS records shown by Vercel
   - Save changes

3. Wait for DNS propagation (often a few minutes, can be longer).

4. Back in Vercel Domains:
   - Ensure domain status becomes **Valid / Configured**
   - Set it as **Primary** domain for production

5. After domain is valid, update these env vars in Vercel and Render:
   - `APP_BASE_URL=https://creator.tmi.production`
   - `AUTH_URL=https://creator.tmi.production`

6. Re-check Slack webhook URLs use this same domain.

### Verify

Open:

`https://creator.tmi.production/api/health`

Expect:

- `status: "ok"`
- `database: ok`
- `redis: ok`
- `slack` URLs present

---

## 5) Deploy worker (Render)

1. Create Render service from repo using `render.yaml` (or manual background worker).
2. Set same core vars as Vercel:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `REDIS_URL`
   - `APP_BASE_URL=https://creator.tmi.production`
   - Slack + AI vars
3. Deploy and check logs.

### Verify in logs

Look for:

- worker startup success
- queue listening on `context`
- no DB/Redis connection failures

---

## 6) Configure Slack app URLs (critical)

In `api.slack.com/apps`:

- **OAuth Redirect URL:** `https://creator.tmi.production/api/auth/callback/slack`
- **Slash Command URL:** `https://creator.tmi.production/api/slack/commands`
- **Interactivity URL:** `https://creator.tmi.production/api/slack/interactions`
- **Events URL:** `https://creator.tmi.production/api/slack/events`

Then:

1. Save all changes
2. Reinstall app to workspace
3. Invite bot to a channel

---

## 7) Demo rehearsal (exact flow for judges)

Use this sequence in front of judges:

1. Open your live URL and show dashboard.
2. In Slack channel, run:
   - `/contextpack summarize current project readiness and blockers`
3. Show progress + generated Context Pack card.
4. Click "View full Pack".
5. Click "Send to AI" (Ollama or configured provider).
6. Show answer and explain confidence/missing info sections.

---

## 8) Judge sharing package

Share this in one message:

- Live URL: `https://creator.tmi.production`
- Slack command: `/contextpack <question>`
- 2-3 sample prompts judges can try
- Optional: short 60-second walkthrough video/GIF

---

## 9) Common last-minute failures

- **401 invalid signature on Slack routes:** wrong `SLACK_SIGNING_SECRET` in Vercel
- **Slash command not responding:** bad Request URL or app not reinstalled
- **Jobs stuck:** Render worker down or `REDIS_URL` mismatch between Vercel/Render
- **Auth/login broken:** wrong `APP_BASE_URL` / `AUTH_URL`
- **No Slack retrieval results:** missing `SLACK_USER_TOKEN` (xoxp + `search:read`)
- **AI send fails:** Ollama host unreachable from Render, or missing cloud API key

---

## 10) Final pre-submission checklist

- [ ] Vercel health endpoint returns OK
- [ ] Custom domain is valid in Vercel (DNS verified via Google)
- [ ] Render worker healthy
- [ ] Slack `/contextpack` works in a channel
- [ ] Pack page loads from live URL
- [ ] Send-to-AI works
- [ ] One clean demo script ready
- [ ] Credentials rotated if they were shared during testing

Good luck — this is enough to present confidently in a hackathon judging round.

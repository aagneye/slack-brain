# Add Slack Brain to your Slack workspace (admin guide)

**Audience:** Slack **workspace admins** who want their company to use Slack Brain.  
**Time:** ~5 minutes · **No coding required**

> [← Back to README](../README.md) · Developer / self-host setup → [setup.md](../setup.md)

---

## What you are doing

You will install the **Slack Brain** app into **your company’s Slack workspace** (once per company).
After that, anyone in the workspace can run `/slackbrain` in a channel to build verified Context
Packs.

Each Slack workspace is kept separate — your company’s data does not mix with other companies.

---

## Before you start

| Requirement | Why |
|---|---|
| **Slack workspace admin** (or permission to install apps) | Only admins can add apps to a workspace |
| Slack Brain **hosted and running** | Web: `https://slackbrain.vercel.app` · Worker: `https://slack-brain.onrender.com/health` |
| A channel for testing (e.g. `#engineering` or `#general`) | `/slackbrain` works in channels, not only in DMs |

Check the service is up:

```bash
curl https://slackbrain.vercel.app/api/health
```

Expect `"status": "ok"`.

---

## Step 0 — Fix OAuth redirect URI (required once)

If Slack shows **“redirect_uri did not match any configured URIs”**, your Slack app is missing this
exact Redirect URL. Add it before trying Sign in with Slack again.

1. Open [api.slack.com/apps](https://api.slack.com/apps) → your **Slack Brain** app
2. **OAuth & Permissions** → **Redirect URLs** → **Add New Redirect URL**
3. Paste **exactly** (no trailing slash):

   ```
   https://slackbrain.vercel.app/api/auth/callback/slack
   ```

4. Also add local for development:

   ```
   http://localhost:3000/api/auth/callback/slack
   ```

5. Click **Save URLs**
6. Try again: [Sign in with Slack](https://slackbrain.vercel.app/add-to-slack)

> The path must be `/api/auth/callback/slack` (Auth.js). Do **not** use a different path.

---

## Step 1 — Install Slack Brain to your workspace

### Option A — Add to Slack button (recommended)

**[→ Click here to add Slack Brain to your workspace](https://slackbrain.vercel.app/add-to-slack)**

This opens Slack’s permission screen. Review the scopes, pick your workspace, and click **Allow**.
You need **workspace admin** rights (or app-install approval) to complete this step.

### Option B — Install from Slack

1. Open Slack (desktop or web).
2. Click your workspace name → **Settings & administration** → **Manage apps**.
3. Click **Browse Apps** or **Build** → search for **Slack Brain** / **Context Pack Engine**.
4. If the app is not in the directory (hackathon demo), use **Option A** above or ask your Slack
   Brain contact for the install link.

### Option C — You are the developer (self-hosting)

If you are building or hosting your own instance, you create the Slack app yourself.  
**[→ Developer setup: create & configure the Slack app](../setup.md#3-slack-app-auth--agent)**

---

## Step 2 — Confirm the app is installed

1. In Slack, open **Apps** in the left sidebar (or **More** → **Apps**).
2. You should see **Slack Brain** (or **Context Pack Engine**).
3. Open the app — you should see it is connected to your workspace.

If installation failed, ask your Slack admin to approve third-party app installs under  
**Workspace settings → Permissions → App approvals**.

---

## Step 3 — Invite the bot to a channel

The bot must be in the channel where people will run commands.

1. Open the channel (e.g. `#engineering`).
2. Run:

   ```
   /invite @Slack Brain
   ```

   *(Use the exact app name shown in your workspace — it may be “Context Pack Engine”.)*

3. Or: channel name → **Integrations** → **Add apps** → select Slack Brain.

---

## Step 4 — Run your first Context Pack

In that channel, type:

```
/slackbrain what should our team know before the next production deploy?
```

**What should happen:**

1. You get an immediate reply: “Building Context Pack for: …”
2. The bot posts progress updates.
3. A **Context Pack card** appears with:
   - **View full Pack** → opens the web review page
   - **Send to AI** → runs the verified context through the configured model

**Good first prompts:**

```
/slackbrain summarize open questions about our hackathon demo
/slackbrain what did we discuss about deploy failures this week?
/slackbrain build onboarding context for a new engineer
```

---

## Step 5 — Optional: better Slack message retrieval

By default, the bot can post Pack cards. To **search your Slack history** for richer context, each
user (or an admin) can connect a Slack **user token** with `search:read`:

1. Open **[slackbrain.vercel.app/signup](https://slackbrain.vercel.app/signup)**.
2. Click **Continue with Slack** (not Google — Slack links your workspace).
3. Go to **Connectors** → **Slack Search** → paste your `xoxp-` user token.

> User tokens are scoped to what **that person** can read in Slack — not the whole company unless
> they have access. This is by design for privacy.

---

## Who can use it after install?

| Person | Can they use `/slackbrain`? | Notes |
|---|---|---|
| Anyone in the workspace | **Yes** | No separate website signup required |
| People outside the workspace | **No** | They are a different company / Slack workspace |
| Guests (single-channel) | Depends on Slack guest rules | May need full member access |

First use auto-creates a workspace record and a user record for whoever ran the command.

---

## Troubleshooting

| Problem | What to try |
|---|---|
| `/slackbrain` not found | App not installed — redo Step 1 |
| “Usage: `/slackbrain <task>`” | Add a task after the command (at least 3 characters) |
| Command does nothing | Check [health](https://slackbrain.vercel.app/api/health); contact whoever hosts Slack Brain |
| Bot replies but no Pack card | Background worker may be down — check `https://slack-brain.onrender.com/health` |
| Empty Slack retrieval | Connect Slack Search token (Step 5) or ask admin to set workspace search token |
| Send to AI fails | AI host (Ollama / OpenAI) not configured on the server — contact host admin |

---

## Admin checklist (copy/paste)

```
[ ] I have Slack workspace admin (or install) rights
[ ] https://slackbrain.vercel.app/api/health returns ok
[ ] Installed Slack Brain via Add to Slack (Step 1)
[ ] Invited bot to a test channel (Step 3)
[ ] Ran /slackbrain <task> successfully (Step 4)
[ ] (Optional) Connected Slack Search on the web for better retrieval (Step 5)
```

---

## Related docs

| Doc | For |
|---|---|
| [README.md](../README.md) | How users use Slack Brain (Slack vs web) |
| [setup.md](../setup.md) | Full developer setup, env vars, Vercel + Render deploy |
| [HACKATHON-LAUNCH-CHECKLIST.md](HACKATHON-LAUNCH-CHECKLIST.md) | End-to-end demo runbook |

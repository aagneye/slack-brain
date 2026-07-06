/**
 * Canonical Slack app Request URLs for a deployed web base URL (Vercel).
 * Use these values in api.slack.com → your app → Slash Commands / Interactivity / Events.
 */
export function getSlackWebhookUrls(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, '');
  return {
    oauthRedirect: `${base}/api/auth/callback/slack`,
    slashCommand: `${base}/api/slack/commands`,
    interactions: `${base}/api/slack/interactions`,
    events: `${base}/api/slack/events`,
  } as const;
}

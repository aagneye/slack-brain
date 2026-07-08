/** Slack slash command — users type `/slackbrain <task>` in a channel. */
export const SLACK_SLASH_COMMAND = 'slackbrain';

export function formatSlackCommandUsage(): string {
  return `Usage: \`/${SLACK_SLASH_COMMAND} <what you want to investigate>\``;
}

/**
 * Canonical Slack app Request URLs for a deployed web base URL (Vercel).
 * Use these values in api.slack.com → your app → Slash Commands / Interactivity / Events.
 */
export function getSlackWebhookUrls(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, '');
  return {
    oauthRedirect: `${base}/api/auth/callback/slack`,
    slashCommand: `${base}/api/slack/commands`,
    slashCommandName: SLACK_SLASH_COMMAND,
    interactions: `${base}/api/slack/interactions`,
    events: `${base}/api/slack/events`,
  } as const;
}

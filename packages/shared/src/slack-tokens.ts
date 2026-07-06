/**
 * Slack API token roles.
 *
 * - **bot** (`xoxb-`): post/update messages, slash command acks, interactions.
 *   Cannot call `search.messages`.
 * - **user_search** (`xoxp-` or user OAuth): `search.messages` scoped to what that
 *   user can read. Required for Context Pack retrieval from Slack.
 *
 * @see https://api.slack.com/methods/search.messages
 */

export type SlackTokenRole = 'bot' | 'user_search';

export const SLACK_SEARCH_SCOPES = ['search:read'] as const;

export const SLACK_BOT_SCOPES = [
  'commands',
  'chat:write',
  'users:read',
  'users:read.email',
  'channels:history',
  'groups:history',
] as const;

export function slackTokenRole(token: string): SlackTokenRole | 'unknown' {
  if (token.startsWith('xoxb-')) return 'bot';
  if (token.startsWith('xoxp-')) return 'user_search';
  return 'unknown';
}

/** `search.messages` requires a user token — bot tokens are rejected by Slack. */
export function assertSlackSearchToken(token: string): void {
  if (token.startsWith('xoxb-')) {
    throw new Error(
      'SLACK_BOT_TOKEN (xoxb-) cannot be used for Slack search. ' +
        'Use a user token (xoxp-) with search:read scope via SLACK_USER_TOKEN or Connect Slack Search in the portal.',
    );
  }
  if (!token.startsWith('xoxp-')) {
    throw new Error(
      'Slack search requires a user token (xoxp-) with search:read. Unrecognized token prefix.',
    );
  }
}

export function assertSlackBotToken(token: string): void {
  if (!token.startsWith('xoxb-')) {
    throw new Error('SLACK_BOT_TOKEN must be a bot token (xoxb-) for posting messages to Slack.');
  }
}

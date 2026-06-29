import type { ContextPack } from '@cpe/shared';
import { buildPackCardBlocks } from '@cpe/slack-kit';

/**
 * Posts the finished Context Pack card back to the originating Slack channel.
 * No-op when no bot token or channel is available.
 */
export async function postPackToSlack(pack: ContextPack, channel?: string): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || !channel) return;

  const blocks = buildPackCardBlocks(pack, process.env.APP_BASE_URL ?? 'http://localhost:3000');
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text: `Context Pack ready: ${pack.task}`, blocks }),
  }).catch(() => {
    /* best-effort notification */
  });
}

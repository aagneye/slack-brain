import type { ContextPack, PackItem } from '@cpe/shared';

/** Block Kit builder for the final Context Pack summary card. */

function confidenceEmoji(score: number): string {
  if (score >= 75) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

function topItems(items: PackItem[], n: number): string {
  return items
    .filter((i) => i.included)
    .slice(0, n)
    .map((i) => {
      const flag = i.flags.outdated ? ' ⚠️' : '';
      return `• <${i.url}|${i.title}>${flag}\n   ${i.summary}`;
    })
    .join('\n');
}

export function buildPackCardBlocks(pack: ContextPack, appBaseUrl: string) {
  const blocks: unknown[] = [];

  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: `Context Pack: ${pack.task}`.slice(0, 150) },
  });

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `${confidenceEmoji(pack.confidence.score)} *Confidence ${pack.confidence.score}/100* — ${pack.confidence.rationale}`,
    },
  });

  const sectionDefs: Array<[string, PackItem[]]> = [
    ['📄 Documents', pack.sections.documents],
    ['💬 Slack', pack.sections.slackThreads],
    ['🔀 Pull Requests', pack.sections.pullRequests],
    ['🎫 Jira', pack.sections.jiraTickets],
    ['🚀 Deploys', pack.sections.deploys],
    ['🚨 Incidents', pack.sections.incidents],
  ];
  for (const [title, items] of sectionDefs) {
    const text = topItems(items, 3);
    if (text) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${title}*\n${text}` } });
    }
  }

  if (pack.missingInformation.length) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🕳️ Missing Information*\n${pack.missingInformation.map((m) => `• ${m.requirement}`).join('\n')}`,
      },
    });
  }

  if (pack.contradictions.length) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚔️ Contradictions*\n${pack.contradictions.map((c) => `• ${c.reason}`).join('\n')}`,
      },
    });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View full Pack' },
        url: `${appBaseUrl}/p/${pack.permalinkSlug}`,
      },
      action('Send to Claude', `send:claude-3.5-sonnet:${pack.id}`, 'primary'),
      action('Send to GPT', `send:gpt-4o:${pack.id}`),
      action('Send to Cursor', `send:cursor:${pack.id}`),
      action('Trim items', `trim:${pack.id}`),
    ],
  });

  return blocks;
}

function action(text: string, value: string, style?: 'primary' | 'danger') {
  return {
    type: 'button',
    text: { type: 'plain_text', text },
    action_id: value.split(':').slice(0, 2).join('_'),
    value,
    ...(style ? { style } : {}),
  };
}

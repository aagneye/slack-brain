import type { JobStatus } from '@cpe/shared';

/** Block Kit builder for the live "Building Context Pack…" progress message. */

const STAGES: { key: JobStatus; label: string }[] = [
  { key: 'understanding', label: 'Understanding task' },
  { key: 'retrieving', label: 'Gathering context' },
  { key: 'ranking', label: 'Ranking relevance' },
  { key: 'verifying', label: 'Verifying (dedupe / gaps)' },
  { key: 'compressing', label: 'Summarizing' },
  { key: 'scoring', label: 'Scoring confidence' },
  { key: 'generating', label: 'Building Pack' },
];

function bar(stage: JobStatus): string {
  const order = STAGES.map((s) => s.key);
  const idx = order.indexOf(stage);
  const filled = idx < 0 ? order.length : idx + 1;
  return '▓'.repeat(filled) + '░'.repeat(Math.max(0, order.length - filled));
}

export function buildProgressBlocks(args: {
  task: string;
  stage: JobStatus;
  perSource?: Record<string, number>;
  note?: string;
}) {
  const lines: string[] = [`*🧠 Building Context Pack*\n>${args.task}`, `\`${bar(args.stage)}\` ${args.stage}`];
  if (args.perSource) {
    const parts = Object.entries(args.perSource).map(([k, v]) => `${k}: ${v < 0 ? '⚠️' : v}`);
    lines.push(parts.join('   •   '));
  }
  if (args.note) lines.push(`_${args.note}_`);
  return [{ type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } }];
}

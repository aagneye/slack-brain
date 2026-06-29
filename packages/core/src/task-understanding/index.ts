import type { TaskIntent, TaskUnderstanding, SourceKind } from '@cpe/shared';

/**
 * Task understanding (stage 1).
 *
 * Extracts intent, entities, a time window, and a required-information checklist
 * from the raw task. The checklist is what gap detection later diffs against.
 *
 * This is a deterministic heuristic baseline; an LLM-backed implementation can
 * replace `understandTask` while keeping the same signature.
 */

const INCIDENT_HINTS = ['failing', 'down', 'error', 'outage', 'broken', 'crash', '5xx', 'timeout', 'incident'];
const CHANGE_HINTS = ['before i', 'change', 'refactor', 'add', 'implement', 'touch', 'modify', 'upgrade'];

/** Required-info checklists per intent — drives missing-context detection. */
const REQUIRED_INFO: Record<TaskIntent, string[]> = {
  incident_investigation: [
    'recent deploys to the affected service',
    'open incident or alert',
    'recent related pull requests',
    'service ownership',
    'error logs or symptoms',
  ],
  change_preparation: [
    'related pull requests',
    'architecture or design docs',
    'service ownership',
    'prior similar changes',
  ],
  lookup: ['authoritative documentation', 'source references'],
  unknown: ['relevant documentation', 'related discussions'],
};

export function classifyIntent(task: string): TaskIntent {
  const t = task.toLowerCase();
  if (INCIDENT_HINTS.some((h) => t.includes(h))) return 'incident_investigation';
  if (CHANGE_HINTS.some((h) => t.includes(h))) return 'change_preparation';
  if (t.startsWith('what') || t.startsWith('where') || t.startsWith('how')) return 'lookup';
  return 'unknown';
}

/**
 * Naive entity extraction: capitalized words, kebab/snake service names, and
 * quoted phrases. An LLM pass can enrich this.
 */
export function extractEntities(task: string): string[] {
  const out = new Set<string>();
  const serviceLike = task.match(/\b[a-z0-9]+(?:[-_][a-z0-9]+)+\b/gi) ?? [];
  for (const s of serviceLike) out.add(s.toLowerCase());
  const proper = task.match(/\b[A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+)?\b/g) ?? [];
  for (const p of proper) out.add(p.trim());
  return [...out].slice(0, 12);
}

function intentSources(intent: TaskIntent): SourceKind[] {
  switch (intent) {
    case 'incident_investigation':
      return ['slack', 'github', 'incident', 'deploy', 'jira'];
    case 'change_preparation':
      return ['github', 'confluence', 'slack', 'jira'];
    case 'lookup':
      return ['confluence', 'notion', 'slack'];
    default:
      return ['slack', 'github', 'confluence'];
  }
}

export function understandTask(task: string): TaskUnderstanding {
  const intent = classifyIntent(task);
  return {
    intent,
    entities: extractEntities(task),
    requiredInfo: REQUIRED_INFO[intent],
    sources: intentSources(intent),
  };
}

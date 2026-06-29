import type { MissingInfo, RetrievedItem, SourceKind } from '@cpe/shared';

/**
 * Missing-context detection (stage 4c).
 *
 * Diffs the required-information checklist (from task understanding) against what
 * was actually retrieved. A requirement is considered satisfied if at least one
 * retained item matches its keywords or its expected source.
 */

interface RequirementRule {
  keywords: string[];
  sources?: SourceKind[];
}

/** Map a checklist phrase to the signals that would satisfy it. */
function ruleFor(requirement: string): RequirementRule {
  const r = requirement.toLowerCase();
  if (r.includes('deploy')) return { keywords: ['deploy', 'release', 'rollout'], sources: ['deploy', 'github'] };
  if (r.includes('incident') || r.includes('alert'))
    return { keywords: ['incident', 'alert', 'pagerduty'], sources: ['incident'] };
  if (r.includes('pull request')) return { keywords: ['pr', 'pull request', 'merge'], sources: ['github'] };
  if (r.includes('ownership')) return { keywords: ['owner', 'team', 'on-call', 'oncall'] };
  if (r.includes('doc')) return { keywords: ['doc', 'design', 'adr', 'rfc'], sources: ['confluence', 'notion'] };
  if (r.includes('log') || r.includes('symptom')) return { keywords: ['log', 'error', 'trace', 'stack'] };
  return { keywords: r.split(/\s+/).filter((w) => w.length > 4) };
}

function satisfied(rule: RequirementRule, items: RetrievedItem[]): boolean {
  return items.some((it) => {
    if (rule.sources && rule.sources.includes(it.source)) return true;
    const text = `${it.title} ${it.body}`.toLowerCase();
    return rule.keywords.some((k) => text.includes(k));
  });
}

export function detectGaps(requiredInfo: string[], items: RetrievedItem[]): MissingInfo[] {
  const missing: MissingInfo[] = [];
  for (const requirement of requiredInfo) {
    const rule = ruleFor(requirement);
    if (!satisfied(rule, items)) {
      missing.push({
        requirement,
        reason: rule.sources
          ? `No matching results from ${rule.sources.join('/')} or keyword match.`
          : 'No retrieved item matched this requirement.',
      });
    }
  }
  return missing;
}

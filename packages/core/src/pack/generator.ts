import type {
  Confidence,
  Contradiction,
  ContextPack,
  ItemType,
  MissingInfo,
  PackItem,
  PackSections,
  RetrievedItem,
  TaskUnderstanding,
} from '@cpe/shared';

/**
 * Context Pack generator (stage 7).
 *
 * Maps verified/ranked items into the fixed Pack sections, preserves citations,
 * and assembles the final ContextPack artifact.
 */

function emptySections(): PackSections {
  return {
    documents: [],
    slackThreads: [],
    pullRequests: [],
    jiraTickets: [],
    deploys: [],
    incidents: [],
  };
}

function sectionFor(type: ItemType): keyof PackSections {
  switch (type) {
    case 'pull_request':
      return 'pullRequests';
    case 'issue':
      return 'jiraTickets';
    case 'deploy':
      return 'deploys';
    case 'incident':
      return 'incidents';
    case 'message':
    case 'thread':
      return 'slackThreads';
    case 'doc':
    default:
      return 'documents';
  }
}

function toPackItem(item: RetrievedItem, summary: string): PackItem {
  return {
    id: item.id,
    source: item.source,
    type: item.type,
    title: item.title,
    summary,
    url: item.url,
    author: item.author,
    createdAt: item.sourceCreatedAt,
    updatedAt: item.sourceUpdatedAt,
    relevanceScore: item.relevance ?? 0,
    flags: item.flags ?? {},
    included: true,
  };
}

export function slugify(task: string): string {
  const base = task
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  const suffix = Math.random().toString(16).slice(2, 6);
  return `${base || 'pack'}-${suffix}`;
}

export interface BuildPackInput {
  jobId: string;
  task: string;
  understanding: TaskUnderstanding;
  items: RetrievedItem[];
  summaries: Map<string, string>;
  confidence: Confidence;
  missing: MissingInfo[];
  contradictions: Contradiction[];
  createdBy: string;
}

export function buildPack(input: BuildPackInput): ContextPack {
  const sections = emptySections();
  for (const item of input.items) {
    const summary = input.summaries.get(item.id) ?? item.body.slice(0, 280);
    sections[sectionFor(item.type)].push(toPackItem(item, summary));
  }

  return {
    id: crypto.randomUUID(),
    jobId: input.jobId,
    task: input.task,
    intent: input.understanding.intent,
    entities: input.understanding.entities,
    timeWindow: input.understanding.timeWindow,
    confidence: input.confidence,
    sections,
    missingInformation: input.missing,
    contradictions: input.contradictions,
    permalinkSlug: slugify(input.task),
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };
}

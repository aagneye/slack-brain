/**
 * Core domain types for Context Pack Engine.
 *
 * These describe the data that flows through the pipeline:
 *   task -> RetrievedItem[] -> PackItem[] -> ContextPack
 */

export type SourceKind =
  | 'slack'
  | 'github'
  | 'jira'
  | 'confluence'
  | 'notion'
  | 'deploy'
  | 'incident';

export type ItemType =
  | 'message'
  | 'thread'
  | 'pull_request'
  | 'issue'
  | 'doc'
  | 'deploy'
  | 'incident';

export type JobStatus =
  | 'queued'
  | 'understanding'
  | 'retrieving'
  | 'ranking'
  | 'verifying'
  | 'compressing'
  | 'scoring'
  | 'generating'
  | 'done'
  | 'partial'
  | 'failed';

export type TaskIntent =
  | 'incident_investigation'
  | 'change_preparation'
  | 'lookup'
  | 'unknown';

export type LLMModel =
  | 'claude-3.5-sonnet'
  | 'claude-3.7-sonnet'
  | 'gpt-4o'
  | 'gpt-4.1'
  | 'cursor'
  | 'ollama';

/** Normalized shape every connector returns. */
export interface RetrievedItem {
  id: string;
  source: SourceKind;
  externalId: string;
  type: ItemType;
  title: string;
  body: string;
  url: string;
  author?: string;
  sourceCreatedAt?: string;
  sourceUpdatedAt?: string;
  contentHash?: string;
  relevance?: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  flags?: ItemFlags;
}

export interface ItemFlags {
  outdated?: boolean;
  duplicateOf?: string | null;
  clusterId?: string | null;
  seenCount?: number;
}

/** A retained, ranked, summarized item inside a Context Pack. */
export interface PackItem {
  id: string;
  source: SourceKind;
  type: ItemType;
  title: string;
  summary: string;
  url: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  relevanceScore: number;
  flags: ItemFlags;
  included: boolean;
}

export interface Contradiction {
  itemAId: string;
  itemBId: string;
  claimA: string;
  claimB: string;
  reason: string;
  confidence: number;
}

export interface MissingInfo {
  requirement: string;
  reason: string;
}

export interface ConfidenceFactors {
  coverage: number;
  agreement: number;
  recency: number;
  sourceQuality: number;
  gapPenalty: number;
}

export interface Confidence {
  score: number; // 0..100
  factors: ConfidenceFactors;
  rationale: string;
}

export interface TimeWindow {
  from?: string;
  to?: string;
}

export interface PackSections {
  documents: PackItem[];
  slackThreads: PackItem[];
  pullRequests: PackItem[];
  jiraTickets: PackItem[];
  deploys: PackItem[];
  incidents: PackItem[];
}

export interface ContextPack {
  id: string;
  jobId: string;
  task: string;
  intent: TaskIntent;
  entities: string[];
  timeWindow?: TimeWindow;
  confidence: Confidence;
  sections: PackSections;
  missingInformation: MissingInfo[];
  contradictions: Contradiction[];
  permalinkSlug: string;
  createdAt: string;
  createdBy: string;
}

/** Output of the task-understanding stage. */
export interface TaskUnderstanding {
  intent: TaskIntent;
  entities: string[];
  timeWindow?: TimeWindow;
  /** Required-information checklist used later for gap detection. */
  requiredInfo: string[];
  sources: SourceKind[];
}

/** Progress event published by the worker and streamed to clients via SSE. */
export interface ProgressEvent {
  jobId: string;
  stage: JobStatus;
  detail?: Record<string, unknown>;
  at: string;
}

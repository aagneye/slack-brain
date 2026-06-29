import type {
  ContextPack,
  ProgressEvent,
  RetrievedItem,
  SourceKind,
  LLMModel,
} from '@cpe/shared';

/**
 * Ports (interfaces) define the boundary between the pure core and the outside
 * world. Adapters (connectors, LLM providers, embeddings, storage, event bus)
 * implement these. The core never imports an adapter directly.
 */

export interface SearchQuery {
  task: string;
  entities: string[];
  timeWindow?: { from?: string; to?: string };
  limit: number;
}

/** A retrieval source: Slack, GitHub, Jira, docs, etc. */
export interface ConnectorPort {
  readonly kind: SourceKind;
  search(query: SearchQuery): Promise<RetrievedItem[]>;
  health(): Promise<{ ok: boolean; detail?: string }>;
}

/** Embedding provider used for ranking, dedupe and contradiction candidates. */
export interface EmbeddingPort {
  embed(texts: string[]): Promise<number[][]>;
}

/** Provider-agnostic LLM access (used by the gateway and for summarization). */
export interface LLMPort {
  complete(input: {
    model: LLMModel | string;
    system?: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }>;
}

/** Publishes progress events (Redis pub/sub -> SSE in the adapter). */
export interface EventBusPort {
  publish(event: ProgressEvent): Promise<void>;
}

/** Persistence boundary for the pipeline. */
export interface StorePort {
  saveItems(jobId: string, items: RetrievedItem[]): Promise<void>;
  savePack(pack: ContextPack): Promise<void>;
  recordAudit(event: {
    workspaceId: string;
    jobId?: string;
    actor?: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }): Promise<void>;
}

/** Everything the pipeline needs, injected at the edge. */
export interface PipelineDeps {
  connectors: ConnectorPort[];
  embeddings: EmbeddingPort;
  llm: LLMPort;
  events: EventBusPort;
  store: StorePort;
}

import Redis from 'ioredis';
import type { ConnectorPort, EmbeddingPort, LLMPort, PipelineDeps } from '@cpe/core';
import { SlackConnector, GitHubConnector } from '@cpe/connectors';
import {
  OpenAIEmbeddings,
  HashingEmbeddings,
  OpenAIProvider,
  AnthropicProvider,
} from '@cpe/llm-gateway';
import { RedisEventBus } from './adapters/event-bus.js';
import { PrismaStore } from './adapters/store.js';

/**
 * Composition root: builds the connectors, embeddings, LLM, event bus and store
 * from environment configuration and assembles PipelineDeps. Connectors with no
 * configured token are simply omitted (the pipeline degrades gracefully).
 */
export function buildPipelineDeps(redis: Redis): PipelineDeps {
  const connectors: ConnectorPort[] = [];
  if (process.env.SLACK_BOT_TOKEN) {
    connectors.push(new SlackConnector({ token: process.env.SLACK_BOT_TOKEN }));
  }
  if (process.env.GITHUB_TOKEN) {
    connectors.push(new GitHubConnector({ token: process.env.GITHUB_TOKEN }));
  }

  const embeddings: EmbeddingPort = process.env.OPENAI_API_KEY
    ? new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY })
    : new HashingEmbeddings();

  const llm: LLMPort | null = process.env.OPENAI_API_KEY
    ? new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY })
    : process.env.ANTHROPIC_API_KEY
      ? new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;

  return {
    connectors,
    embeddings,
    llm: llm ?? new NoopLLM(),
    events: new RedisEventBus(redis),
    store: new PrismaStore(),
  };
}

/** Fallback LLM used when no provider key is set (compression falls back too). */
class NoopLLM implements LLMPort {
  async complete(): Promise<{ text: string }> {
    return { text: '' };
  }
}

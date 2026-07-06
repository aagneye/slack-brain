import type Redis from 'ioredis';
import type { ConnectorPort, EmbeddingPort, LLMPort, PipelineDeps } from '@cpe/core';
import { SlackSearchConnector, GitHubConnector } from '@cpe/connectors';
import { assertSlackSearchToken, logger } from '@cpe/shared';
import { resolveSlackSearchToken } from '@cpe/db';
import {
  OpenAIEmbeddings,
  HashingEmbeddings,
  OpenAIProvider,
  AnthropicProvider,
} from '@cpe/llm-gateway';
import { RedisEventBus } from './adapters/event-bus.js';
import { PrismaStore } from './adapters/store.js';
import type { ContextJobData } from './types.js';

/**
 * Builds pipeline dependencies for a single job. Slack search uses the
 * **requesting user's** token (xoxp-), never the bot token.
 */
export async function buildPipelineDepsForJob(
  redis: Redis,
  job: ContextJobData,
): Promise<PipelineDeps> {
  const connectors: ConnectorPort[] = [];

  const slackSearch = await resolveSlackSearchToken({
    userId: job.createdBy,
    workspaceId: job.workspaceId,
  });
  if (slackSearch) {
    try {
      assertSlackSearchToken(slackSearch.token);
      connectors.push(new SlackSearchConnector({ userToken: slackSearch.token }));
    } catch (err) {
      logger.warn(
        { jobId: job.jobId, source: slackSearch.source, err },
        'invalid slack search token — skipping Slack retrieval',
      );
    }
  } else {
    logger.warn(
      { jobId: job.jobId },
      'no slack user search token — connect Slack Search in portal or set SLACK_USER_TOKEN',
    );
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

/** @deprecated Use buildPipelineDepsForJob — connectors are resolved per job. */
export function buildPipelineDeps(redis: Redis): PipelineDeps {
  void redis;
  throw new Error('buildPipelineDeps is deprecated; use buildPipelineDepsForJob per job');
}

class NoopLLM implements LLMPort {
  async complete(): Promise<{ text: string }> {
    return { text: '' };
  }
}

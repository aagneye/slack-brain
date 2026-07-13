import type Redis from 'ioredis';
import type { ConnectorPort, PipelineDeps } from '@cpe/core';
import { SlackSearchConnector, GitHubConnector } from '@cpe/connectors';
import { assertSlackSearchToken, logger } from '@cpe/shared';
import { resolveSlackSearchToken } from '@cpe/db';
import {
  compressionModel,
  createEmbeddings,
  createPipelineLLM,
  isOllamaEnabled,
} from '@cpe/llm-gateway';
import { RedisEventBus } from './adapters/event-bus.js';
import { PrismaStore } from './adapters/store.js';
import type { ContextJobData } from './types.js';

/**
 * Builds pipeline dependencies for a single job. Slack search uses the
 * **requesting user's** token (xoxp-), never the bot token.
 * LLM + embeddings route through the gateway factory (Ollama when enabled).
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

  if (isOllamaEnabled()) {
    logger.info(
      { jobId: job.jobId, model: process.env.OLLAMA_CHAT_MODEL ?? 'qwen2.5-coder:7b' },
      'pipeline using Ollama for compression',
    );
  }

  return {
    connectors,
    embeddings: createEmbeddings(),
    llm: createPipelineLLM(),
    compressionModel: compressionModel(),
    events: new RedisEventBus(redis),
    store: new PrismaStore(),
  };
}

/** @deprecated Use buildPipelineDepsForJob — connectors are resolved per job. */
export function buildPipelineDeps(redis: Redis): PipelineDeps {
  void redis;
  throw new Error('buildPipelineDeps is deprecated; use buildPipelineDepsForJob per job');
}

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { runPipeline } from '@cpe/core';
import { jobs as jobRepo } from '@cpe/db';
import { checkOllamaHealth, isOllamaEnabled } from '@cpe/llm-gateway';
import { getBullMqConnection, getRedisOptions, logger } from '@cpe/shared';
import type { ContextJobData } from './types.js';
import { buildPipelineDepsForJob } from './deps.js';
import { postPackToSlack } from './adapters/slack-notify.js';
import { validateWorkerProductionEnv } from './env.js';

/**
 * Worker entrypoint.
 *
 * Consumes the `context` queue and runs the Context Pack pipeline for each job,
 * publishing progress and persisting the resulting Pack. Failures mark the job
 * failed and emit a terminal progress event so the UI stops waiting.
 */
await validateWorkerProductionEnv();

if (isOllamaEnabled()) {
  const ollama = await checkOllamaHealth();
  if (ollama.ok) {
    logger.info({ models: ollama.models?.slice(0, 8) }, 'ollama ready');
  } else {
    logger.warn({ detail: ollama.detail }, 'ollama enabled but unreachable — pipeline may fail');
  }
}

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = new Redis(redisUrl, getRedisOptions(redisUrl, { lazyConnect: false }));

const worker = new Worker<ContextJobData>(
  'context',
  async (job) => {
    const { jobId, workspaceId, task, createdBy, channel } = job.data;
    logger.info({ jobId, task }, 'pipeline start');
    const jobDeps = await buildPipelineDepsForJob(connection, job.data);
    try {
      const pack = await runPipeline({ jobId, workspaceId, task, createdBy, deps: jobDeps });
      await postPackToSlack(pack, channel);
      logger.info({ jobId, packId: pack.id, confidence: pack.confidence.score }, 'pipeline done');
      return { packId: pack.id };
    } catch (err) {
      logger.error({ jobId, err }, 'pipeline failed');
      await jobRepo.markFailed(jobId, (err as Error).message);
      await jobDeps.events.publish({
        jobId,
        stage: 'failed',
        detail: { error: (err as Error).message },
        at: new Date().toISOString(),
      });
      throw err;
    }
  },
  { connection: getBullMqConnection(redisUrl), concurrency: Number(process.env.WORKER_CONCURRENCY ?? 4) },
);

worker.on('ready', () => logger.info('worker ready, listening on "context" queue'));
worker.on('failed', (job, err) => logger.warn({ jobId: job?.id, err: err.message }, 'job failed'));

async function shutdown() {
  logger.info('shutting down worker');
  await worker.close();
  connection.disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

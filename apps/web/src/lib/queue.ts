import { Queue } from 'bullmq';
import { getBullMqConnection } from '@cpe/shared';
import { redisUrl } from './redis.js';

/**
 * The single context-pipeline queue. The web app enqueues jobs here; the worker
 * service consumes them. Job payload carries everything the pipeline needs.
 */
export interface ContextJobData {
  jobId: string;
  workspaceId: string;
  task: string;
  createdBy: string;
  channel?: string;
  threadTs?: string;
}

const globalForQueue = globalThis as unknown as { contextQueue?: Queue<ContextJobData> };

export const QUEUE_NAME = 'context';

const queueConnection = getBullMqConnection(redisUrl);

function getContextQueue(): Queue<ContextJobData> {
  if (!globalForQueue.contextQueue) {
    globalForQueue.contextQueue = new Queue<ContextJobData>(QUEUE_NAME, {
      connection: queueConnection,
    });
  }
  return globalForQueue.contextQueue;
}

export function enqueueContextJob(data: ContextJobData) {
  return getContextQueue().add('build-pack', data, {
    jobId: data.jobId,
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 1,
  });
}

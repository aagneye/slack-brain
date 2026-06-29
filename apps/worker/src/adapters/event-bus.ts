import type Redis from 'ioredis';
import type { EventBusPort } from '@cpe/core';
import type { ProgressEvent } from '@cpe/shared';

/**
 * Redis pub/sub event bus. Publishes pipeline progress events to the per-job
 * channel that the web app's SSE endpoint subscribes to.
 */
export class RedisEventBus implements EventBusPort {
  constructor(private readonly redis: Redis) {}

  async publish(event: ProgressEvent): Promise<void> {
    await this.redis.publish(`job:${event.jobId}:progress`, JSON.stringify(event));
  }
}

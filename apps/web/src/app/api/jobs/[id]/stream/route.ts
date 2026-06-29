import Redis from 'ioredis';
import { progressChannel } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/jobs/:id/stream — Server-Sent Events.
 *
 * Subscribes to the job's Redis progress channel and relays each stage event to
 * the browser. Uses its own short-lived Redis subscriber so it can be cleanly
 * torn down when the client disconnects.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const jobId = params.id;
  const channel = progressChannel(jobId);
  const sub = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: string) => controller.enqueue(enc.encode(data));

      send(`event: open\ndata: {"jobId":"${jobId}"}\n\n`);

      await sub.subscribe(channel);
      sub.on('message', (_chan, message) => {
        send(`event: stage\ndata: ${message}\n\n`);
        try {
          const evt = JSON.parse(message) as { stage?: string };
          if (evt.stage === 'done' || evt.stage === 'failed') {
            send(`event: done\ndata: ${message}\n\n`);
            controller.close();
          }
        } catch {
          /* ignore malformed */
        }
      });

      // Heartbeat to keep proxies from closing the connection.
      const heartbeat = setInterval(() => send(`: ping\n\n`), 15000);
      controller.enqueue(enc.encode('')); // flush
      (controller as unknown as { _cleanup?: () => void })._cleanup = () => clearInterval(heartbeat);
    },
    async cancel() {
      await sub.unsubscribe(channel).catch(() => {});
      sub.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

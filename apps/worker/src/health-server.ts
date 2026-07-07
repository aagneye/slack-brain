import http from 'node:http';
import { logger } from '@cpe/shared';

/**
 * Binds to Render's PORT when the service is misconfigured as a Web Service.
 * Background Workers do not set PORT; Web Services require an open port or Render hibernates the process.
 */
export function startHealthServer(): http.Server | null {
  const port = Number(process.env.PORT);
  if (!port || Number.isNaN(port)) return null;

  const server = http.createServer((req, res) => {
    const path = req.url?.split('?')[0] ?? '/';
    if (path === '/' || path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'cpe-worker', queue: 'context' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(port, '0.0.0.0', () => {
    logger.warn(
      { port },
      'health server listening — Render Web Service mode; prefer Background Worker (no PORT) for production',
    );
  });

  return server;
}

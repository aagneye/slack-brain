import { assertProductionReady, loadConfig } from '@cpe/shared';

/**
 * Validates required secrets when the Node.js server boots in production.
 * Called from instrumentation.ts so misconfigured deploys fail at startup.
 */
export function validateWebProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const config = loadConfig();
  assertProductionReady(process.env, config, { role: 'web' });

  if (!process.env.AUTH_URL && config.APP_BASE_URL) {
    process.env.AUTH_URL = config.APP_BASE_URL;
  }
}

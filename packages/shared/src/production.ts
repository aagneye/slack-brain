import type { AppConfig } from './config.js';

export interface ProductionCheck {
  name: string;
  ok: boolean;
  message?: string;
}

/**
 * Returns a list of production readiness checks. Used by the web health endpoint
 * and worker startup to fail fast when required secrets are missing.
 */
export function getProductionChecks(
  env: NodeJS.ProcessEnv = process.env,
  config?: AppConfig,
  options: { role?: 'web' | 'worker' } = {},
): ProductionCheck[] {
  const role = options.role ?? 'web';
  const isProd = (config?.NODE_ENV ?? env.NODE_ENV) === 'production';
  if (!isProd) return [{ name: 'environment', ok: true, message: 'not production' }];

  const checks: ProductionCheck[] = [];

  const require = (name: string, value?: string) => {
    checks.push({
      name,
      ok: !!value && value.length > 0,
      message: value ? undefined : 'required in production',
    });
  };

  require('DATABASE_URL', env.DATABASE_URL);
  require('REDIS_URL', env.REDIS_URL);
  require('SLACK_BOT_TOKEN', env.SLACK_BOT_TOKEN);

  if (role === 'web') {
    require('AUTH_SECRET', env.AUTH_SECRET);
    require('APP_BASE_URL', env.APP_BASE_URL ?? config?.APP_BASE_URL);
    require('SLACK_CLIENT_ID', env.SLACK_CLIENT_ID);
    require('SLACK_CLIENT_SECRET', env.SLACK_CLIENT_SECRET);
    require('SLACK_SIGNING_SECRET', env.SLACK_SIGNING_SECRET);

    if (env.APP_BASE_URL?.includes('localhost')) {
      checks.push({
        name: 'APP_BASE_URL',
        ok: false,
        message: 'must not point at localhost in production',
      });
    }
  }

  if (role === 'worker') {
    require('GITHUB_TOKEN', env.GITHUB_TOKEN);
  }

  const hasLlm = !!(env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY);
  checks.push({
    name: 'LLM_PROVIDER',
    ok: hasLlm,
    message: hasLlm ? undefined : 'set OPENAI_API_KEY or ANTHROPIC_API_KEY',
  });

  return checks;
}

export function assertProductionReady(
  env: NodeJS.ProcessEnv = process.env,
  config?: AppConfig,
  options: { role?: 'web' | 'worker' } = {},
): void {
  const failed = getProductionChecks(env, config, options).filter((c) => !c.ok);
  if (failed.length === 0) return;
  const lines = failed.map((c) => `  - ${c.name}: ${c.message ?? 'missing'}`).join('\n');
  throw new Error(`Production configuration incomplete:\n${lines}`);
}

import { z } from 'zod';

/**
 * Centralized, validated environment configuration.
 * Call loadConfig() once at process start; it throws early on misconfiguration.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),

  GITHUB_TOKEN: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  EMBEDDINGS_PROVIDER: z.enum(['openai']).default('openai'),

  RETRIEVAL_TIMEOUT_MS: z.coerce.number().int().positive().default(9000),
  RETRIEVAL_TOP_K_PER_SOURCE: z.coerce.number().int().positive().default(8),
  DEDUPE_COSINE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.92),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper to reset the memoized config. */
export function __resetConfigForTests(): void {
  cached = null;
}

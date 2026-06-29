import pino from 'pino';

/**
 * Structured logger. In development it pretty-prints; in production it emits JSON
 * suitable for log aggregation. Never log secrets — connector tokens are redacted.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'token',
      'accessToken',
      'access_token',
      '*.token',
      '*.accessToken',
      'headers.authorization',
      'SLACK_BOT_TOKEN',
      'GITHUB_TOKEN',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
    ],
    censor: '[redacted]',
  },
});

export type Logger = typeof logger;

/** Create a child logger bound to a job for traceable, correlated logs. */
export function jobLogger(jobId: string): Logger {
  return logger.child({ jobId });
}

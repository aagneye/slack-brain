/**
 * Next.js instrumentation — runs once when the Node.js server starts.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateWebProductionEnv } = await import('./src/lib/env');
    validateWebProductionEnv();
  }
}

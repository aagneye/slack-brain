import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies an inbound Slack request signature (v0 scheme) with a 5-minute
 * replay window. Call with the *raw* request body.
 */
export function verifySlackSignature(args: {
  signingSecret: string;
  signature: string | null;
  timestamp: string | null;
  rawBody: string;
}): boolean {
  const { signingSecret, signature, timestamp, rawBody } = args;
  if (!signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false; // replay guard

  const base = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac('sha256', signingSecret).update(base).digest('hex')}`;

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Reads the raw body and verifies it against the configured signing secret. */
export async function readVerifiedSlackBody(req: Request): Promise<string | null> {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return null;
  const rawBody = await req.text();
  const ok = verifySlackSignature({
    signingSecret: secret,
    signature: req.headers.get('x-slack-signature'),
    timestamp: req.headers.get('x-slack-request-timestamp'),
    rawBody,
  });
  return ok ? rawBody : null;
}

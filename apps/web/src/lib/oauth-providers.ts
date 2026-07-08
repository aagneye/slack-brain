/** Read env vars at runtime (avoids Next.js inlining undefined at compile time). */
export function envVar(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  return raw.trim().replace(/^["']|["']$/g, '');
}

export function getOAuthProviderFlags() {
  return {
    google: !!(envVar('GOOGLE_CLIENT_ID') && envVar('GOOGLE_CLIENT_SECRET')),
    slack: !!(envVar('SLACK_CLIENT_ID') && envVar('SLACK_CLIENT_SECRET')),
  };
}

export function getAuthBaseUrl(): string {
  return envVar('AUTH_URL') ?? envVar('APP_BASE_URL') ?? 'http://localhost:3000';
}

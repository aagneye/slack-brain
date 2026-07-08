import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth-config';

/**
 * Auth.js configuration.
 *
 * Sign in with Google or Slack. Slack OIDC also links the workspace team id
 * so every query can be scoped to that workspace.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

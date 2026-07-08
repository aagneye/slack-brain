'use client';

import { signOut } from 'next-auth/react';

/** Client-side sign out — avoids broken server redirects when auth config is invalid. */
export function SignOutButton({
  className,
  label = 'Sign out',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={className ?? 'btn-ghost px-3 py-1.5 text-sm'}
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      {label}
    </button>
  );
}

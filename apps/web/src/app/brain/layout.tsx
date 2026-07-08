import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BrainShell } from '@/components/brain/BrainShell';
import { AuthProviders } from '@/components/auth/AuthProviders';
import { getSessionUser, isAuthenticatedSession } from '@/lib/auth-session';

export default async function BrainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isAuthenticatedSession(session)) {
    redirect('/signup?callbackUrl=/brain');
  }

  const user = getSessionUser(session);

  return (
    <AuthProviders>
      <BrainShell userName={user.name}>{children}</BrainShell>
    </AuthProviders>
  );
}

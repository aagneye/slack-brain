import { auth } from '@/auth';
import { BrainShell } from '@/components/brain/BrainShell';
import { getSessionUser } from '@/lib/session-user';

export default async function BrainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = getSessionUser(session);

  return <BrainShell userName={user.name}>{children}</BrainShell>;
}

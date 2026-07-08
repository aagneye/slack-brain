import { SignOutButton } from '@/components/auth/SignOutButton';
import { BrainNav } from './BrainNav';

export function BrainShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string | null;
}) {
  return (
    <div className="premium-shell flex min-h-screen">
      <BrainNav userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="premium-glass sticky top-0 z-20 mx-6 mt-4 flex items-center justify-between rounded-2xl px-6 py-4">
          <p className="text-sm font-medium text-slate-600">Slack Brain workspace</p>
          <SignOutButton />
        </header>
        <main className="flex-1 px-6 pb-8 pt-6">{children}</main>
      </div>
    </div>
  );
}

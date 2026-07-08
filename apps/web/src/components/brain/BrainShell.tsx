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
    <div className="flex min-h-screen bg-slate-50">
      <BrainNav userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <p className="text-sm text-slate-500">Slack Brain workspace</p>
          <SignOutButton />
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

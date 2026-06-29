import { auth } from '@/auth';
import { AppNav } from '@/components/AppNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <AppNav user={{ name: session?.user?.name }} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

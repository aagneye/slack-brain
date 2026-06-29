import { auth } from '@/auth';
import { AppNav } from '@/components/AppNav';
import { ProgressStream } from '@/components/ProgressStream';

export default async function JobProgressPage({ params }: { params: { id: string } }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <AppNav user={{ name: session?.user?.name }} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <ProgressStream jobId={params.id} />
        <p className="mt-4 text-center text-sm text-neutral-500">
          You&apos;ll be redirected to the Context Pack when it&apos;s ready.
        </p>
      </main>
    </div>
  );
}

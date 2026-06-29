import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="card w-full text-center">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Use your Slack account. This authenticates you and links your workspace so the engine can
          gather context on your behalf.
        </p>

        <form
          className="mt-6"
          action={async () => {
            'use server';
            await signIn('slack', { redirectTo: '/dashboard' });
          }}
        >
          <button type="submit" className="btn-primary w-full">
            Sign in with Slack
          </button>
        </form>

        <p className="mt-4 text-xs text-neutral-500">
          By continuing you agree to let Context Pack Engine read the sources you connect.
        </p>
      </div>
    </main>
  );
}

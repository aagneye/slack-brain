import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AuthProviders } from '@/components/auth/AuthProviders';
import { SignInButtons } from '@/components/auth/SignInButtons';

export default async function SignUpPage() {
  const session = await auth();
  if (session) redirect('/brain');

  return (
    <AuthProviders>
      <div className="flex min-h-screen flex-col bg-white">
        <header className="border-b border-slate-100 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
              🧠
            </span>
            Slack Brain
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <div className="card shadow-card">
              <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
              <p className="mt-2 text-sm text-slate-600">
                Sign up with Google or Slack to enter your Brain workspace — brainstorm, map
                knowledge, and build Context Packs.
              </p>
              <div className="mt-8">
                <SignInButtons callbackUrl="/brain" />
              </div>
              <p className="mt-6 text-center text-xs text-slate-500">
                By continuing you agree to use this hackathon demo responsibly.
              </p>
            </div>
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </AuthProviders>
  );
}

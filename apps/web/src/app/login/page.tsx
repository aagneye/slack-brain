import { redirect } from 'next/navigation';

/** Legacy route — sign up / sign in lives at /signup */
export default function LoginPage() {
  redirect('/signup');
}

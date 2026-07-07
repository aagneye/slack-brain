import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Slack Brain — Verified context before AI',
  description:
    'Sign up with Google or Slack. Brainstorm, map knowledge, and build verified Context Packs for your team.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-slate-900">{children}</body>
    </html>
  );
}

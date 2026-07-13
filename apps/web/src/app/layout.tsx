import type { Metadata } from 'next';
import { DM_Sans, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const landingSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-landing-sans',
  display: 'swap',
});

const landingDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-landing-display',
  display: 'swap',
});

const landingMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-landing-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Slack Brain — Verified context before AI',
  description:
    'Sign up with Google or Slack. Brainstorm, map knowledge, and build verified Context Packs for your team.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${landingSans.variable} ${landingDisplay.variable} ${landingMono.variable}`}
    >
      <body className="min-h-screen bg-land-cream font-sans text-land-ink antialiased">
        {children}
      </body>
    </html>
  );
}

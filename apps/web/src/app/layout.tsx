import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Context Pack Engine',
  description: 'Build verified, source-cited context before any AI does work.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4f46e5',
          soft: '#eef2ff',
          dark: '#312e81',
        },
        brain: {
          violet: '#7c3aed',
          sky: '#0ea5e9',
          mint: '#10b981',
          amber: '#f59e0b',
        },
        land: {
          cream: '#F5F7FF',
          paper: '#FFFFFF',
          forest: '#4F46E5',
          deep: '#1E1B4B',
          ink: '#0F172A',
          muted: '#64748B',
          line: '#E2E8F0',
          mint: '#A78BFA',
          soft: '#EEF2FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-landing-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-landing-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-landing-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px -8px rgba(15, 23, 42, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;

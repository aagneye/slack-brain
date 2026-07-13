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
          cream: '#F6F5F1',
          paper: '#FFFFFF',
          forest: '#1E392A',
          deep: '#121614',
          ink: '#1A1A17',
          muted: '#6B6B63',
          line: '#E4E2DA',
          mint: '#5EEAD4',
          soft: '#E8F0EB',
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

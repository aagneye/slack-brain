/** @type {import('next').NextConfig} */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Monorepo: load root .env so OAuth keys in ../../.env are available to Next.js.
loadEnvConfig(path.join(__dirname, '../..'));

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Transpile the workspace packages (they ship raw TS with NodeNext `.js` import paths).
  transpilePackages: [
    '@cpe/shared',
    '@cpe/core',
    '@cpe/db',
    '@cpe/connectors',
    '@cpe/llm-gateway',
    '@cpe/slack-kit',
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bullmq', 'ioredis'],
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Workspace packages use `.js` extensions in TS sources (NodeNext ESM).
    // Map those specifiers to `.ts` files when webpack resolves modules.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;

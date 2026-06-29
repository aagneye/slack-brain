/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile the workspace packages (they ship raw TS).
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
  },
};

export default nextConfig;

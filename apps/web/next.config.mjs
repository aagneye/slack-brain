/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  },
  webpack: (config) => {
    // Workspace packages use `.js` extensions in TS sources (NodeNext ESM).
    // Map those specifiers to `.ts` files when webpack resolves modules.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;

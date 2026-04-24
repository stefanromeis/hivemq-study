import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages so Next resolves TS sources directly.
  transpilePackages: ['@hivemq-study/ui', '@hivemq-study/types'],
  // Multi-Zones: future feature zones will be wired in via `rewrites()` below.
  async rewrites() {
    return [
      // Example (to be enabled when apps/analytics ships):
      // { source: '/analytics/:path*', destination: 'http://localhost:3001/analytics/:path*' },
    ];
  },
};

export default withNextIntl(nextConfig);

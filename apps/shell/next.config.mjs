import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isStatic = process.env.BUILD_MODE === 'static';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages so Next resolves TS sources directly.
  transpilePackages: ['@hivemq-study/ui', '@hivemq-study/types'],
  eslint: { ignoreDuringBuilds: true },
  // Static export for GitHub Pages
  ...(isStatic && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  ...(basePath && { basePath, assetPrefix: basePath }),
  // Multi-Zones: future feature zones will be wired in via `rewrites()` below.
  ...(!isStatic && {
    async rewrites() {
      return [
        // Example (to be enabled when apps/analytics ships):
        // { source: '/analytics/:path*', destination: 'http://localhost:3001/analytics/:path*' },
      ];
    },
  }),
};

export default withNextIntl(nextConfig);

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  // 'always' is required for static export (GitHub Pages); 'as-needed' for dev/server
  localePrefix: process.env.BUILD_MODE === 'static' ? 'always' : 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

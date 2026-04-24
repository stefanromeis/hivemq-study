import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match everything except API routes, Next internals, and static files.
  // Note: middleware is skipped entirely during `output: 'export'` builds.
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};

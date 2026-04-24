import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const isSupported = (l: string | undefined): l is Locale =>
    typeof l === 'string' && (routing.locales as readonly string[]).includes(l);

  const locale = isSupported(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

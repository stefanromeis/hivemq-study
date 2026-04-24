import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomePage() {
  const t = await getTranslations('common');
  const tNav = await getTranslations('nav');

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{t('appName')}</h1>
      <p className="mt-3 text-lg text-slate-600">{t('tagline')}</p>

      <nav className="mt-10 flex gap-4" aria-label="Primary">
        <Link
          href="/dashboard"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          {tNav('dashboard')}
        </Link>
      </nav>
    </main>
  );
}

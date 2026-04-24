import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TelemetryDashboard } from '@/components/telemetry-dashboard';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');
  const tc = await getTranslations('dashboard.connectionStatus');

  const labels = {
    empty: t('empty'),
    feed: t('feed'),
    connecting: tc('connecting'),
    connected: tc('connected'),
    error: tc('error', { message: '{message}' }),
    disconnected: tc('disconnected'),
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t('description')}</p>
        </header>
        <section>
          <TelemetryDashboard labels={labels} />
        </section>
      </div>
    </main>
  );
}

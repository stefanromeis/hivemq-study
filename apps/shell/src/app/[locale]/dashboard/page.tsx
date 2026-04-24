import { getTranslations } from 'next-intl/server';
import { TelemetryDashboard } from '@/components/telemetry-dashboard';

export default async function DashboardPage() {
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
    <main className="mx-auto max-w-7xl px-6 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-slate-600">{t('description')}</p>
      </header>
      <section className="mt-8">
        <TelemetryDashboard labels={labels} />
      </section>
    </main>
  );
}

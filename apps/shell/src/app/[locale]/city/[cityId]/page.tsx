import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CITIES, CITIES_BY_ID } from '@/lib/cities';
import { fetchHourlyWeather } from '@/lib/open-meteo';
import { CityWeatherView } from '@/components/city-weather-view';

interface Props {
  params: Promise<{ locale: string; cityId: string }>;
}

export function generateStaticParams() {
  return CITIES.map((c) => ({ cityId: c.id }));
}

export default async function CityPage({ params }: Props) {
  const { locale, cityId } = await params;
  setRequestLocale(locale);

  const city = CITIES_BY_ID[cityId];
  if (!city) notFound();

  const t = await getTranslations('city');
  const weather = await fetchHourlyWeather(city.lat, city.lon);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t('backToDashboard')}
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {city.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('subtitle', { lat: city.lat.toFixed(2), lon: city.lon.toFixed(2) })}
          </p>
        </header>

        <CityWeatherView weather={weather} cityName={city.name} />
      </div>
    </main>
  );
}

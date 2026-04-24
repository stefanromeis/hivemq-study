'use client';

import { useState, useCallback } from 'react';
import type { HourlyWeather } from '@/lib/open-meteo';

type Status = 'green' | 'orange' | 'red';

interface AiSummary {
  summary: string;
  status: Status;
}

const STATUS_STYLES: Record<Status, { bg: string; ring: string; text: string; dot: string }> = {
  green: { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  orange: { bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  red: { bg: 'bg-red-500/10', ring: 'ring-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081';

interface Props {
  cityName: string;
  hourly: HourlyWeather;
}

export function AiWeatherSummary({ cityName, hourly }: Props) {
  const [result, setResult] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/weather/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityName,
          weather: {
            time: hourly.time,
            temperature_2m: hourly.temperature_2m,
            relative_humidity_2m: hourly.relative_humidity_2m,
            apparent_temperature: hourly.apparent_temperature,
            precipitation: hourly.precipitation,
            weather_code: hourly.weather_code,
            wind_speed_10m: hourly.wind_speed_10m,
            cloud_cover: hourly.cloud_cover,
          },
        }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data: AiSummary = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [cityName, hourly]);

  // Not yet generated — show button
  if (!result && !loading && !error) {
    return (
      <div className="card flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-sm font-medium text-slate-200">AI Weather Analysis</p>
            <p className="text-xs text-slate-500">Powered by Groq (Llama 3)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={generate}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:shadow-cyan-400/30"
        >
          Generate summary
        </button>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="card flex items-center gap-3 p-5">
        <svg className="h-5 w-5 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-slate-400">Analyzing weather data with AI…</span>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="card flex items-center justify-between p-4 ring-1 ring-inset ring-red-500/20 bg-red-500/10">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-400">AI analysis failed</p>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={generate}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Result
  if (!result) return null;
  const cfg = STATUS_STYLES[result.status];

  return (
    <div className={`card p-5 ring-1 ring-inset ${cfg.bg} ${cfg.ring}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-bold text-slate-200">AI Weather Analysis</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.ring} ${cfg.text} ring-1 ring-inset`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {result.status}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{result.summary}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] text-slate-600">Powered by Groq · Llama 3</p>
        <button
          type="button"
          onClick={generate}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}

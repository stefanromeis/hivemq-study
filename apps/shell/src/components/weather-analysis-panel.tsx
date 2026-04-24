'use client';

import { useMemo } from 'react';
import type { HourlyWeather } from '@/lib/open-meteo';
import { analyzeWeather, type Status, type AnalysisItem } from '@/lib/weather-analysis';

const STATUS_CONFIG: Record<Status, { bg: string; ring: string; text: string; dot: string; label: string }> = {
  green: {
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Normal',
  },
  orange: {
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    label: 'Caution',
  },
  red: {
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
    text: 'text-red-400',
    dot: 'bg-red-400',
    label: 'Alert',
  },
};

export function WeatherAnalysisPanel({ hourly }: { hourly: HourlyWeather }) {
  const analysis = useMemo(() => analyzeWeather(hourly), [hourly]);
  const overallCfg = STATUS_CONFIG[analysis.overall];

  return (
    <div className="space-y-4">
      {/* Overall status banner */}
      <div
        className={`card flex items-start gap-4 p-5 ring-1 ring-inset ${overallCfg.bg} ${overallCfg.ring}`}
      >
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${overallCfg.dot}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${overallCfg.text}`}>
              {overallCfg.label}
            </h3>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            {analysis.summary}
          </p>
        </div>
      </div>

      {/* Individual analysis items */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {analysis.items.map((item) => (
          <AnalysisCard key={item.category} item={item} />
        ))}
      </div>
    </div>
  );
}

function AnalysisCard({ item }: { item: AnalysisItem }) {
  const cfg = STATUS_CONFIG[item.status];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{item.icon}</span>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {item.category}
          </h4>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${cfg.bg} ${cfg.ring} ${cfg.text}`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-200">{item.headline}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
    </div>
  );
}

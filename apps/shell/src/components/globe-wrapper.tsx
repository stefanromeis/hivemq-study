'use client';

import dynamic from 'next/dynamic';
import type { Telemetry } from '@hivemq-study/types';

const Globe = dynamic(
  () => import('@/components/telemetry-globe').then((m) => m.TelemetryGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 shadow-lg shadow-black/20">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-6 w-6 animate-spin text-slate-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-slate-500">Loading globe…</span>
        </div>
      </div>
    ),
  },
);

export function GlobeWrapper({ messages }: { messages: Telemetry[] }) {
  return <Globe messages={messages} />;
}

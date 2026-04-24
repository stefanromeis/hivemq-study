'use client';

import dynamic from 'next/dynamic';
import type { Telemetry } from '@hivemq-study/types';

const Globe = dynamic(
  () => import('@/components/telemetry-globe').then((m) => m.TelemetryGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-slate-200 bg-slate-950 text-slate-500">
        Loading globe…
      </div>
    ),
  },
);

export function GlobeWrapper({ messages }: { messages: Telemetry[] }) {
  return <Globe messages={messages} />;
}

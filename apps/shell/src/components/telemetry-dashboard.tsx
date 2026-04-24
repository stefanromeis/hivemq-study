'use client';

import dynamic from 'next/dynamic';
import { Badge } from '@hivemq-study/ui';
import { useTelemetryStream } from '@/lib/use-telemetry-stream';
import { GlobeWrapper } from '@/components/globe-wrapper';

const TelemetryCharts = dynamic(
  () => import('@/components/telemetry-charts').then((m) => m.TelemetryCharts),
  { ssr: false },
);

export interface DashboardLabels {
  empty: string;
  feed: string;
  connecting: string;
  connected: string;
  error: string;
  disconnected: string;
}

export function TelemetryDashboard({ labels }: { labels: DashboardLabels }) {
  const { messages, connection } = useTelemetryStream(200);

  return (
    <div className="space-y-6">
      {/* Connection status bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-slate-700">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
        <ConnectionBadge connection={connection} labels={labels} />
      </div>

      {messages.length === 0 ? (
        <p role="status" aria-live="polite" className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {labels.empty}
        </p>
      ) : (
        <>
          {/* Globe + message feed side by side */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <GlobeWrapper messages={messages} />
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-2">
                <h3 className="text-sm font-semibold text-slate-700">{labels.feed}</h3>
              </div>
              <ul className="max-h-[356px] divide-y divide-slate-100 overflow-y-auto">
                {messages.slice(0, 50).map((m, i) => (
                  <li key={`${m.deviceId}-${m.ts}-${i}`} className="grid grid-cols-4 gap-2 px-4 py-2 text-sm">
                    <span className="font-mono text-xs text-slate-500">
                      {new Date(m.ts).toLocaleTimeString()}
                    </span>
                    <span className="font-medium">{m.deviceId}</span>
                    <span className="tabular-nums">{m.temp.toFixed(1)}°C</span>
                    <span className="text-right text-xs text-slate-500">
                      {m.humidity != null && `${m.humidity}%RH`}
                      {m.battery != null && ` · 🔋${m.battery.toFixed(0)}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* D3 Charts */}
          <TelemetryCharts messages={messages} />
        </>
      )}
    </div>
  );
}

function ConnectionBadge({ connection, labels }: { connection: ReturnType<typeof useTelemetryStream>['connection']; labels: DashboardLabels }) {
  switch (connection.status) {
    case 'connecting':
      return <Badge variant="muted">{labels.connecting}</Badge>;
    case 'connected':
      return <Badge variant="success">{labels.connected}</Badge>;
    case 'error':
      return <Badge variant="danger">{labels.error.replace('{message}', connection.message)}</Badge>;
    case 'disconnected':
      return <Badge variant="warning">{labels.disconnected}</Badge>;
  }
}

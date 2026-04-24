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
      <div className="card flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-300">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>
        <ConnectionBadge connection={connection} labels={labels} />
      </div>

      {messages.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="card flex flex-col items-center justify-center px-4 py-16"
        >
          {connection.status === 'connecting' ? (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/50 ring-1 ring-slate-700/50">
                <svg
                  className="h-6 w-6 animate-spin text-cyan-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">{labels.connecting}</p>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/50 ring-1 ring-slate-700/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-500">{labels.empty}</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Globe + message feed side by side */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="animate-fade-in-up">
              <GlobeWrapper messages={messages} />
            </div>
            <div
              className="card animate-fade-in-up overflow-hidden"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                  />
                </svg>
                <h3 className="text-sm font-semibold text-slate-200">
                  {labels.feed}
                </h3>
              </div>
              <ul className="max-h-[356px] divide-y divide-slate-800/50 overflow-y-auto">
                {messages.slice(0, 50).map((m, i) => (
                  <li
                    key={`${m.deviceId}-${m.ts}-${i}`}
                    className="grid grid-cols-4 gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-slate-800/50"
                  >
                    <span className="font-mono text-xs text-slate-500">
                      {new Date(m.ts).toLocaleTimeString()}
                    </span>
                    <span className="font-medium text-slate-200">
                      {m.deviceId}
                    </span>
                    <span className="tabular-nums text-cyan-400">
                      {m.temp.toFixed(1)}°C
                    </span>
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
      return (
        <Badge variant="success" className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
          {labels.connected}
        </Badge>
      );
    case 'error':
      return <Badge variant="danger">{labels.error.replace('{message}', connection.message)}</Badge>;
    case 'disconnected':
      return <Badge variant="warning">{labels.disconnected}</Badge>;
  }
}

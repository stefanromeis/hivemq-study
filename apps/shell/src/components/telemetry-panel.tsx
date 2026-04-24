'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@hivemq-study/ui';
import { useTelemetryStream } from '@/lib/use-telemetry-stream';

export function TelemetryPanel() {
  const t = useTranslations('dashboard');
  const { messages, connection } = useTelemetryStream();

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <span className="text-sm font-medium text-slate-700">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
        <ConnectionBadge connection={connection} />
      </div>

      {messages.length === 0 ? (
        <p role="status" aria-live="polite" className="px-4 py-8 text-center text-sm text-slate-500">
          {t('empty')}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {messages.map((m, i) => (
            <li key={`${m.deviceId}-${m.ts}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="font-mono text-xs text-slate-500">{m.ts}</span>
              <span className="font-medium">{m.deviceId}</span>
              <span className="tabular-nums">{m.temp.toFixed(1)}°C</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConnectionBadge({ connection }: { connection: ReturnType<typeof useTelemetryStream>['connection'] }) {
  const t = useTranslations('dashboard.connectionStatus');
  switch (connection.status) {
    case 'connecting':
      return <Badge variant="muted">{t('connecting')}</Badge>;
    case 'connected':
      return <Badge variant="success">{t('connected')}</Badge>;
    case 'error':
      return <Badge variant="danger">{t('error', { message: connection.message })}</Badge>;
    case 'disconnected':
      return <Badge variant="warning">{t('disconnected')}</Badge>;
  }
}

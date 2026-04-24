'use client';

import dynamic from 'next/dynamic';

const TelemetryDashboard = dynamic(
  () => import('@/components/telemetry-dashboard').then((m) => m.TelemetryDashboard),
  { ssr: false },
);

export function DashboardClient() {
  return <TelemetryDashboard />;
}

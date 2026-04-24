import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../messages/en.json';
import { TelemetryPanel } from './telemetry-panel';

vi.mock('@/lib/use-telemetry-stream', () => ({
  useTelemetryStream: () => ({
    messages: [],
    connection: { status: 'connected' as const },
  }),
}));

describe('TelemetryPanel', () => {
  it('shows the empty state when no messages have arrived', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <TelemetryPanel />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/no telemetry yet/i);
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });
});

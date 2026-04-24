import { describe, expect, it } from 'vitest';
import { TelemetrySchema, Topics } from './mqtt';

describe('Topics', () => {
  it('builds a device-telemetry topic from an id', () => {
    expect(Topics.deviceTelemetry('dev-001')).toBe('devices/dev-001/telemetry');
  });
});

describe('TelemetrySchema', () => {
  it('accepts a valid telemetry payload', () => {
    const payload = {
      deviceId: 'dev-001',
      ts: '2026-04-24T10:00:00.000Z',
      temp: 21.3,
      humidity: 42,
    };
    expect(TelemetrySchema.parse(payload)).toEqual(payload);
  });

  it('rejects humidity out of range', () => {
    expect(() =>
      TelemetrySchema.parse({
        deviceId: 'dev-001',
        ts: '2026-04-24T10:00:00.000Z',
        temp: 21.3,
        humidity: 150,
      }),
    ).toThrow();
  });
});

import { z } from 'zod';

/**
 * MQTT topic patterns used across the system.
 * Kept as string templates so they can be compared, filtered, and built with a single source of truth.
 */
export const Topics = {
  deviceTelemetry: (deviceId: string) => `devices/${deviceId}/telemetry`,
  deviceStatus: (deviceId: string) => `devices/${deviceId}/status`,
  deviceCommand: (deviceId: string) => `devices/${deviceId}/cmd`,
  allDeviceTelemetry: 'devices/+/telemetry',
  allDeviceStatus: 'devices/+/status',
} as const;

/** Telemetry frame emitted by a simulated device. */
export const TelemetrySchema = z.object({
  deviceId: z.string().min(1),
  ts: z.string().datetime(),
  temp: z.number(),
  humidity: z.number().min(0).max(100).optional(),
  battery: z.number().min(0).max(100).optional(),
});
export type Telemetry = z.infer<typeof TelemetrySchema>;

/** Device status messages (online / offline / fault). */
export const DeviceStatusSchema = z.object({
  deviceId: z.string().min(1),
  state: z.enum(['online', 'offline', 'fault']),
  since: z.string().datetime(),
  reason: z.string().optional(),
});
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;

/** Server → device commands. */
export const DeviceCommandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('reboot'), deviceId: z.string() }),
  z.object({ kind: z.literal('setInterval'), deviceId: z.string(), seconds: z.number().int().positive() }),
]);
export type DeviceCommand = z.infer<typeof DeviceCommandSchema>;

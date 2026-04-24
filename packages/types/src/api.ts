import { z } from 'zod';

/** A device as the API surfaces it (latest-known snapshot). */
export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.enum(['online', 'offline', 'fault']),
  lastSeenAt: z.string().datetime().nullable(),
  lastTelemetry: z
    .object({
      temp: z.number(),
      humidity: z.number().optional(),
      battery: z.number().optional(),
      ts: z.string().datetime(),
    })
    .nullable(),
});
export type Device = z.infer<typeof DeviceSchema>;

/** Paginated list response. Same shape for every list endpoint. */
export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });

/** Standard error envelope returned by the backend. */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

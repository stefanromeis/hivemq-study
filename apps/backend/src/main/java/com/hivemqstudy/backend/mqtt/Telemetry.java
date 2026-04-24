package com.hivemqstudy.backend.mqtt;

import java.time.Instant;

/**
 * Matches the Zod `TelemetrySchema` in packages/types/src/mqtt.ts — keep these two in sync.
 *
 * Future: generate this from the Zod schema so drift is impossible. See docs/ROADMAP.md.
 */
public record Telemetry(String deviceId, Instant ts, double temp, Double humidity, Double battery) {
}

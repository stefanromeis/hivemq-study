package com.hivemqstudy.backend.devices;

import com.hivemqstudy.backend.mqtt.Telemetry;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory latest-known-state store for devices. Keyed by deviceId.
 *
 * Intentionally simple — swap for Redis / Postgres when persistence matters.
 */
@Component
public class DeviceStore {

    public record DeviceView(String id, String state, Instant lastSeenAt, Telemetry lastTelemetry) {
    }

    private final Map<String, DeviceView> byId = new ConcurrentHashMap<>();

    public void recordTelemetry(Telemetry t) {
        Objects.requireNonNull(t, "telemetry");
        byId.compute(t.deviceId(), (id, previous) -> new DeviceView(
                id,
                "online",
                t.ts(),
                t));
    }

    public void recordStatus(String deviceId, String state, Instant at) {
        Objects.requireNonNull(deviceId, "deviceId");
        byId.compute(deviceId, (id, previous) -> {
            Telemetry last = previous == null ? null : previous.lastTelemetry();
            return new DeviceView(id, state, at, last);
        });
    }

    public List<DeviceView> list() {
        return byId.values().stream().toList();
    }
}

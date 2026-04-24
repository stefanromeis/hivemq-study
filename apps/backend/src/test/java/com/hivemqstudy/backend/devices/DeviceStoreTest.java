package com.hivemqstudy.backend.devices;

import com.hivemqstudy.backend.mqtt.Telemetry;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class DeviceStoreTest {

    @Test
    void recordsAndReadsBackTheLatestTelemetry() {
        DeviceStore store = new DeviceStore();
        Telemetry t = new Telemetry("dev-001", Instant.parse("2026-04-24T10:00:00Z"), 21.3, 42.0, 88.0);

        store.recordTelemetry(t);

        assertThat(store.list()).singleElement().satisfies(d -> {
            assertThat(d.id()).isEqualTo("dev-001");
            assertThat(d.state()).isEqualTo("online");
            assertThat(d.lastTelemetry()).isEqualTo(t);
        });
    }

    @Test
    void statusUpdatePreservesLastTelemetry() {
        DeviceStore store = new DeviceStore();
        Telemetry t = new Telemetry("dev-001", Instant.parse("2026-04-24T10:00:00Z"), 21.3, null, null);
        store.recordTelemetry(t);

        store.recordStatus("dev-001", "offline", Instant.parse("2026-04-24T10:05:00Z"));

        assertThat(store.list()).singleElement().satisfies(d -> {
            assertThat(d.state()).isEqualTo("offline");
            assertThat(d.lastTelemetry()).isEqualTo(t);
        });
    }
}

package com.hivemqstudy.backend.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hivemq.client.mqtt.datatypes.MqttQos;
import com.hivemq.client.mqtt.mqtt5.Mqtt5AsyncClient;
import com.hivemqstudy.backend.devices.DeviceStore;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Connects to the broker and subscribes to the telemetry topic pattern.
 * Messages are deserialized and forwarded into DeviceStore.
 *
 * Connection lifecycle is bound to the Spring context: connect on startup,
 * disconnect cleanly on shutdown.
 */
@Component
public class TelemetrySubscriber {

    private static final Logger log = LoggerFactory.getLogger(TelemetrySubscriber.class);

    private final Mqtt5AsyncClient client;
    private final MqttProperties props;
    private final DeviceStore store;
    private final ObjectMapper mapper;

    public TelemetrySubscriber(Mqtt5AsyncClient client,
                               MqttProperties props,
                               DeviceStore store,
                               ObjectMapper mapper) {
        this.client = client;
        this.props = props;
        this.store = store;
        this.mapper = mapper;
    }

    @PostConstruct
    public void start() {
        client.connect()
                .thenRun(() -> log.info("MQTT connected to {}:{} as {}", props.host(), props.port(), props.clientId()))
                .thenCompose(v -> client.subscribeWith()
                        .topicFilter(props.topicTelemetry())
                        .qos(MqttQos.AT_LEAST_ONCE)
                        .callback(msg -> handle(msg.getPayloadAsBytes()))
                        .send())
                .whenComplete((ack, err) -> {
                    if (err != null) {
                        log.error("MQTT subscribe failed for {}", props.topicTelemetry(), err);
                    } else {
                        log.info("Subscribed to {}", props.topicTelemetry());
                    }
                });
    }

    @PreDestroy
    public void stop() {
        client.disconnect().whenComplete((v, err) -> {
            if (err != null) {
                log.warn("MQTT disconnect failed", err);
            } else {
                log.info("MQTT disconnected cleanly");
            }
        });
    }

    private void handle(byte[] payload) {
        try {
            Telemetry t = mapper.readValue(new String(payload, StandardCharsets.UTF_8), Telemetry.class);
            store.recordTelemetry(t);
        } catch (Exception e) {
            // Don't crash the subscriber loop on malformed input; drop and log.
            log.warn("Dropped malformed telemetry payload: {}", e.getMessage());
        }
    }
}

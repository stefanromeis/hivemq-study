package com.hivemqstudy.backend.mqtt;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Broker connection settings bound from application.yml under `mqtt.*`.
 * Keeping this as a record makes the settings immutable and testable in isolation.
 */
@ConfigurationProperties(prefix = "mqtt")
public record MqttProperties(
        String host,
        int port,
        String clientId,
        String topicTelemetry,
        String topicStatus) {
}

package com.hivemqstudy.backend.mqtt;

import com.hivemq.client.mqtt.MqttClient;
import com.hivemq.client.mqtt.mqtt5.Mqtt5AsyncClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires up a single shared MQTT 5 async client. The client is connected lazily
 * by TelemetrySubscriber on application startup.
 */
@Configuration
@EnableConfigurationProperties(MqttProperties.class)
public class MqttConfig {

    @Bean
    public Mqtt5AsyncClient mqttClient(MqttProperties props) {
        return MqttClient.builder()
                .useMqttVersion5()
                .identifier(props.clientId())
                .serverHost(props.host())
                .serverPort(props.port())
                .automaticReconnectWithDefaultConfig()
                .buildAsync();
    }
}

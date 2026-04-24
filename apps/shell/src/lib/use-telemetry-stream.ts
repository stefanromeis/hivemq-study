'use client';

import { useEffect, useRef, useState } from 'react';
import mqtt, { type MqttClient } from 'mqtt';
import { Topics, TelemetrySchema, type Telemetry } from '@hivemq-study/types';

type ConnectionState =
  | { status: 'connecting' }
  | { status: 'connected' }
  | { status: 'disconnected' }
  | { status: 'error'; message: string };

export interface TelemetryStream {
  messages: Telemetry[];
  connection: ConnectionState;
}

/**
 * Subscribes to `devices/+/telemetry` over MQTT-over-WebSocket.
 *
 * Defaults to the local HiveMQ WebSocket listener. Override at runtime via
 * NEXT_PUBLIC_MQTT_WS_URL in `.env.local` (useful for pointing at HiveMQ Cloud).
 *
 * Keeps only the most recent `bufferSize` messages to bound memory.
 */
export function useTelemetryStream(bufferSize = 50): TelemetryStream {
  const [messages, setMessages] = useState<Telemetry[]>([]);
  const [connection, setConnection] = useState<ConnectionState>({ status: 'connecting' });
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_MQTT_WS_URL ?? 'ws://localhost:8000/mqtt';
    const client = mqtt.connect(url, {
      clientId: `shell-${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 2000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setConnection({ status: 'connected' });
      client.subscribe(Topics.allDeviceTelemetry, { qos: 0 });
    });

    client.on('reconnect', () => setConnection({ status: 'connecting' }));
    client.on('close', () => setConnection({ status: 'disconnected' }));
    client.on('error', (err) => setConnection({ status: 'error', message: err.message }));

    client.on('message', (_topic, payload) => {
      try {
        const parsed = TelemetrySchema.parse(JSON.parse(payload.toString()));
        setMessages((prev) => {
          const next = [parsed, ...prev];
          return next.length > bufferSize ? next.slice(0, bufferSize) : next;
        });
      } catch (err) {
        // Silently drop malformed frames; surface as a connection warning, not a crash.
        // In a real app we'd emit to a logger here.
        console.warn('[telemetry] dropped malformed payload', err);
      }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, [bufferSize]);

  return { messages, connection };
}

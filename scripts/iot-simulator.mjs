#!/usr/bin/env node

/**
 * Simulates realistic IoT sensor devices publishing to the local HiveMQ broker.
 * Each device has sinusoidal temperature curves, drifting humidity, and draining batteries.
 *
 * Usage:  node scripts/iot-simulator.mjs
 * Env:    MQTT_URL  (default tcp://localhost:1883)
 *         INTERVAL  (default 5, seconds)
 *         DEVICES   (default 8, number of simulated devices)
 */

import mqtt from 'mqtt';

const MQTT_URL = process.env.MQTT_URL ?? 'tcp://localhost:1883';
const INTERVAL = Number(process.env.INTERVAL ?? 5) * 1000;
const DEVICE_COUNT = Number(process.env.DEVICES ?? 8);

const DEVICE_PROFILES = [
  { prefix: 'sensor', baseTemp: 22, tempAmplitude: 4, humidityBase: 55 },
  { prefix: 'outdoor', baseTemp: 15, tempAmplitude: 10, humidityBase: 70 },
  { prefix: 'freezer', baseTemp: -18, tempAmplitude: 2, humidityBase: 30 },
  { prefix: 'server-room', baseTemp: 28, tempAmplitude: 3, humidityBase: 25 },
];

const devices = Array.from({ length: DEVICE_COUNT }, (_, i) => {
  const profile = DEVICE_PROFILES[i % DEVICE_PROFILES.length];
  return {
    id: `${profile.prefix}-${String(i + 1).padStart(3, '0')}`,
    baseTemp: profile.baseTemp,
    tempAmplitude: profile.tempAmplitude,
    humidityBase: profile.humidityBase,
    battery: 70 + Math.random() * 30,
    phaseOffset: Math.random() * Math.PI * 2,
    noise: () => (Math.random() - 0.5) * 0.8,
  };
});

function generateTelemetry(device, tick) {
  const tempCycle = Math.sin(tick * 0.05 + device.phaseOffset) * device.tempAmplitude;
  const temp = Math.round((device.baseTemp + tempCycle + device.noise()) * 10) / 10;

  const humidityDrift = Math.sin(tick * 0.03 + device.phaseOffset + 1) * 8;
  const humidity = Math.round(Math.min(100, Math.max(0, device.humidityBase + humidityDrift + device.noise())) * 10) / 10;

  device.battery = Math.max(0, device.battery - (0.01 + Math.random() * 0.04));
  const battery = Math.round(device.battery * 10) / 10;

  return {
    deviceId: device.id,
    ts: new Date().toISOString(),
    temp,
    humidity,
    battery,
  };
}

const client = mqtt.connect(MQTT_URL, {
  clientId: `iot-sim-${Date.now().toString(36)}`,
  clean: true,
});

let tick = 0;

client.on('connect', () => {
  console.log(`Connected to ${MQTT_URL} — simulating ${DEVICE_COUNT} devices every ${INTERVAL / 1000}s`);
  publish();
  setInterval(publish, INTERVAL);
});

client.on('error', (err) => {
  console.error('MQTT error:', err.message);
});

function publish() {
  tick++;
  for (const device of devices) {
    const payload = generateTelemetry(device, tick);
    const topic = `devices/${device.id}/telemetry`;
    client.publish(topic, JSON.stringify(payload), { qos: 0 });
  }
  const sample = devices[0];
  const t = generateTelemetry(sample, tick);
  console.log(`[tick ${tick}] ${DEVICE_COUNT} devices | sample ${sample.id}: ${t.temp}°C, ${t.humidity}%RH, bat ${t.battery}%`);
}

process.on('SIGINT', () => {
  console.log('\nShutting down…');
  client.end(false, () => process.exit(0));
});

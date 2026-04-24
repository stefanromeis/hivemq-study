#!/usr/bin/env node

/**
 * Fetches real weather data from Open-Meteo (free, no API key) for several
 * cities and publishes each as a device on `devices/{city}/telemetry` every
 * INTERVAL seconds via MQTT.
 *
 * Usage:  node scripts/weather-publisher.mjs
 * Env:    MQTT_URL (default tcp://localhost:1883)
 *         INTERVAL (default 10, seconds)
 */

import mqtt from 'mqtt';

const MQTT_URL = process.env.MQTT_URL ?? 'tcp://localhost:1883';
const INTERVAL = Number(process.env.INTERVAL ?? 10) * 1000;

const CITIES = [
  { id: 'vienna', name: 'Vienna', lat: 48.21, lon: 16.37 },
  { id: 'berlin', name: 'Berlin', lat: 52.52, lon: 13.41 },
  { id: 'london', name: 'London', lat: 51.51, lon: -0.13 },
  { id: 'new-york', name: 'New York', lat: 40.71, lon: -74.01 },
  { id: 'tokyo', name: 'Tokyo', lat: 35.68, lon: 139.69 },
];

// Simulated battery drain per city (resets on restart)
const batteries = Object.fromEntries(CITIES.map((c) => [c.id, 80 + Math.random() * 20]));

async function fetchWeather(city) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
    `&current=temperature_2m,relative_humidity_2m&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const data = await res.json();

  return {
    temp: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
  };
}

function drainBattery(cityId) {
  batteries[cityId] = Math.max(0, batteries[cityId] - (0.02 + Math.random() * 0.08));
  return Math.round(batteries[cityId] * 10) / 10;
}

const client = mqtt.connect(MQTT_URL, {
  clientId: `weather-pub-${Date.now().toString(36)}`,
  clean: true,
});

client.on('connect', () => {
  console.log(`Connected to ${MQTT_URL}`);
  publish(); // fire immediately, then on interval
  setInterval(publish, INTERVAL);
});

client.on('error', (err) => {
  console.error('MQTT error:', err.message);
});

async function publish() {
  for (const city of CITIES) {
    try {
      const weather = await fetchWeather(city);
      const payload = {
        deviceId: city.id,
        ts: new Date().toISOString(),
        temp: weather.temp,
        humidity: weather.humidity,
        battery: drainBattery(city.id),
      };

      const topic = `devices/${city.id}/telemetry`;
      client.publish(topic, JSON.stringify(payload), { qos: 0 });
      console.log(`[${city.name}] ${weather.temp}°C, ${weather.humidity}% humidity, battery ${payload.battery}%`);
    } catch (err) {
      console.warn(`[${city.name}] fetch failed: ${err.message}`);
    }
  }
}

process.on('SIGINT', () => {
  console.log('\nShutting down…');
  client.end(false, () => process.exit(0));
});

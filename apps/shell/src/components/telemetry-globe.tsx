'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Telemetry } from '@hivemq-study/types';

/** Known city coordinates for the weather publisher devices */
const CITY_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  vienna: { lat: 48.21, lon: 16.37, name: 'Vienna' },
  berlin: { lat: 52.52, lon: 13.41, name: 'Berlin' },
  london: { lat: 51.51, lon: -0.13, name: 'London' },
  'new-york': { lat: 40.71, lon: -74.01, name: 'New York' },
  tokyo: { lat: 35.68, lon: 139.69, name: 'Tokyo' },
};

function latLonToVec3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function tempToColor(temp: number): string {
  // Map -20..40°C to blue..red
  const t = Math.max(0, Math.min(1, (temp + 20) / 60));
  const r = Math.round(t * 255);
  const b = Math.round((1 - t) * 255);
  return `rgb(${r}, ${Math.round(80 + (1 - Math.abs(t - 0.5) * 2) * 120)}, ${b})`;
}

function RotatingGlobe({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

function GlobeMarker({ lat, lon, name, telemetry }: {
  lat: number;
  lon: number;
  name: string;
  telemetry: Telemetry | null;
}) {
  const position = useMemo(() => latLonToVec3(lat, lon, 1.02), [lat, lon]);
  const color = telemetry ? tempToColor(telemetry.temp) : '#888888';

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <Html distanceFactor={3} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-xs text-white shadow-lg">
          <div className="font-semibold">{name}</div>
          {telemetry ? (
            <>
              <div>{telemetry.temp.toFixed(1)}°C</div>
              {telemetry.humidity != null && <div>{telemetry.humidity}% RH</div>}
              {telemetry.battery != null && <div>🔋 {telemetry.battery.toFixed(1)}%</div>}
            </>
          ) : (
            <div className="text-slate-400">No data</div>
          )}
        </div>
      </Html>
    </group>
  );
}

interface TelemetryGlobeProps {
  messages: Telemetry[];
}

export function TelemetryGlobe({ messages }: TelemetryGlobeProps) {
  // Get latest telemetry per city-based device
  const latestByDevice = useMemo(() => {
    const map = new Map<string, Telemetry>();
    // messages are newest-first, so first occurrence wins
    for (const m of messages) {
      if (!map.has(m.deviceId)) {
        map.set(m.deviceId, m);
      }
    }
    return map;
  }, [messages]);

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-lg shadow-black/20">
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 3, 5]} intensity={1} />
        <RotatingGlobe>
          {/* Globe sphere */}
          <Sphere args={[1, 64, 64]}>
            <meshStandardMaterial
              color="#1e3a5f"
              wireframe={false}
              transparent
              opacity={0.85}
            />
          </Sphere>
          {/* Wireframe overlay */}
          <Sphere args={[1.005, 32, 32]}>
            <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.15} />
          </Sphere>
          {/* City markers */}
          {Object.entries(CITY_COORDS).map(([id, city]) => (
            <GlobeMarker
              key={id}
              lat={city.lat}
              lon={city.lon}
              name={city.name}
              telemetry={latestByDevice.get(id) ?? null}
            />
          ))}
        </RotatingGlobe>
        <OrbitControls
          enableZoom
          enablePan={false}
          minDistance={2}
          maxDistance={5}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}

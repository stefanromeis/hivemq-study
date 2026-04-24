'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Telemetry } from '@hivemq-study/types';
import { CITIES } from '@/lib/cities';

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

/** Convert a GeoJSON coordinate ring to 3D points on the sphere surface. */
function ringToPoints(coords: number[][], radius: number): [number, number, number][] {
  return coords.map(([lon, lat]) => latLonToVec3(lat!, lon!, radius));
}

/** Load 110m land polygons from world-atlas and render as lines on the globe. */
function Coastlines({ radius = 1.006 }: { radius?: number }) {
  const [lines, setLines] = useState<[number, number, number][][]>([]);

  useEffect(() => {
    import('world-atlas/land-110m.json').then((topoRaw) => {
      const topo = topoRaw.default as unknown as Topology<{ land: GeometryCollection }>;
      const geojson = feature(topo, topo.objects.land);
      const result: [number, number, number][][] = [];

      const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
      for (const feat of features) {
        if (feat.type !== 'Feature' || !feat.geometry) continue;
        const geom = feat.geometry as { type: string; coordinates: number[][][] | number[][][][] };
        if (geom.type === 'Polygon') {
          for (const ring of geom.coordinates as number[][][]) {
            result.push(ringToPoints(ring, radius));
          }
        } else if (geom.type === 'MultiPolygon') {
          for (const polygon of geom.coordinates as number[][][][]) {
            for (const ring of polygon) {
              result.push(ringToPoints(ring, radius));
            }
          }
        }
      }
      setLines(result);
    });
  }, [radius]);

  return (
    <>
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#4ade80"
          lineWidth={0.5}
          transparent
          opacity={0.4}
        />
      ))}
    </>
  );
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

function GlobeMarker({ lat, lon, name, cityId, telemetry, onCityClick }: {
  lat: number;
  lon: number;
  name: string;
  cityId: string;
  telemetry: Telemetry | null;
  onCityClick?: (cityId: string) => void;
}) {
  const position = useMemo(() => latLonToVec3(lat, lon, 1.02), [lat, lon]);
  const color = telemetry ? tempToColor(telemetry.temp) : '#888888';

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <Html distanceFactor={3} style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          onClick={() => onCityClick?.(cityId)}
          className="whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-xs text-white shadow-lg transition-colors hover:bg-cyan-900/90 cursor-pointer"
        >
          <div className="font-semibold">{name}</div>
          {telemetry ? (
            <>
              <div>{telemetry.temp.toFixed(1)}°C</div>
              {telemetry.humidity != null && <div>{telemetry.humidity}% RH</div>}
            </>
          ) : (
            <div className="text-slate-400">No data</div>
          )}
          <div className="mt-0.5 text-[10px] text-cyan-400">Details →</div>
        </button>
      </Html>
    </group>
  );
}

interface TelemetryGlobeProps {
  messages: Telemetry[];
  onCityClick?: (cityId: string) => void;
}

export function TelemetryGlobe({ messages, onCityClick }: TelemetryGlobeProps) {
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
          {/* Coastlines / land outlines */}
          <Coastlines />
          {/* City markers */}
          {CITIES.map((city) => (
            <GlobeMarker
              key={city.id}
              cityId={city.id}
              lat={city.lat}
              lon={city.lon}
              name={city.name}
              telemetry={latestByDevice.get(city.id) ?? null}
              onCityClick={onCityClick}
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

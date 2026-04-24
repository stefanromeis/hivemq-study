'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { Telemetry } from '@hivemq-study/types';

interface TelemetryChartsProps {
  messages: Telemetry[];
}

/**
 * D3-powered telemetry charts:
 * 1. Temperature sparkline per device (last N readings)
 * 2. Humidity bar chart (latest per device)
 * 3. Battery gauge (latest per device)
 */
export function TelemetryCharts({ messages }: TelemetryChartsProps) {
  // Group messages by device, keep chronological order (oldest first)
  const byDevice = useMemo(() => {
    const map = new Map<string, Telemetry[]>();
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!;
      let arr = map.get(m.deviceId);
      if (!arr) {
        arr = [];
        map.set(m.deviceId, arr);
      }
      arr.push(m);
    }
    return map;
  }, [messages]);

  const deviceIds = useMemo(() => [...byDevice.keys()].sort(), [byDevice]);

  if (deviceIds.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Temperature sparklines */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Temperature history</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deviceIds.map((id) => (
            <TemperatureSparkline key={id} deviceId={id} data={byDevice.get(id)!} />
          ))}
        </div>
      </div>

      {/* Humidity + Battery bars */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Humidity</h3>
          <HumidityChart deviceData={byDevice} deviceIds={deviceIds} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Battery</h3>
          <BatteryChart deviceData={byDevice} deviceIds={deviceIds} />
        </div>
      </div>
    </div>
  );
}

function TemperatureSparkline({ deviceId, data }: { deviceId: string; data: Telemetry[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 200;
    const height = 50;
    const margin = { top: 4, right: 4, bottom: 4, left: 4 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, w]);
    const temps = data.map((d) => d.temp);
    const yMin = d3.min(temps)! - 1;
    const yMax = d3.max(temps)! + 1;
    const y = d3.scaleLinear().domain([yMin, yMax]).range([h, 0]);

    const line = d3.line<Telemetry>()
      .x((_, i) => x(i))
      .y((d) => y(d.temp))
      .curve(d3.curveMonotoneX);

    // Gradient area
    const area = d3.area<Telemetry>()
      .x((_, i) => x(i))
      .y0(h)
      .y1((d) => y(d.temp))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('d', area)
      .attr('fill', 'rgba(59, 130, 246, 0.1)');

    g.append('path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1.5);

    // Latest point
    const last = data[data.length - 1]!;
    g.append('circle')
      .attr('cx', x(data.length - 1))
      .attr('cy', y(last.temp))
      .attr('r', 3)
      .attr('fill', '#3b82f6');
  }, [data]);

  const latest = data[data.length - 1]!;

  return (
    <div className="rounded border border-slate-100 bg-slate-50 p-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-medium text-slate-600">{deviceId}</span>
        <span className="tabular-nums text-slate-800">{latest.temp.toFixed(1)}°C</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 200 50" className="mt-1 w-full" />
    </div>
  );
}

function HumidityChart({
  deviceData,
  deviceIds,
}: {
  deviceData: Map<string, Telemetry[]>;
  deviceIds: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const entries = deviceIds
      .map((id) => {
        const arr = deviceData.get(id)!;
        const latest = arr[arr.length - 1]!;
        return { id, humidity: latest.humidity ?? 0 };
      })
      .filter((e) => e.humidity > 0);

    if (entries.length === 0) return;

    const width = 300;
    const height = entries.length * 28 + 10;
    const margin = { top: 5, right: 40, bottom: 5, left: 80 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(entries.map((e) => e.id)).range([0, h]).padding(0.3);
    const x = d3.scaleLinear().domain([0, 100]).range([0, w]);

    g.selectAll('rect')
      .data(entries)
      .join('rect')
      .attr('y', (d) => y(d.id)!)
      .attr('x', 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.humidity))
      .attr('fill', '#06b6d4')
      .attr('rx', 3);

    g.selectAll('.label')
      .data(entries)
      .join('text')
      .attr('y', (d) => y(d.id)! + y.bandwidth() / 2)
      .attr('x', -4)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#64748b')
      .text((d) => d.id);

    g.selectAll('.value')
      .data(entries)
      .join('text')
      .attr('y', (d) => y(d.id)! + y.bandwidth() / 2)
      .attr('x', (d) => x(d.humidity) + 4)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#334155')
      .text((d) => `${d.humidity}%`);

    svg.attr('viewBox', `0 0 ${width} ${height}`);
  }, [deviceData, deviceIds]);

  return <svg ref={svgRef} className="w-full" />;
}

function BatteryChart({
  deviceData,
  deviceIds,
}: {
  deviceData: Map<string, Telemetry[]>;
  deviceIds: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const entries = deviceIds
      .map((id) => {
        const arr = deviceData.get(id)!;
        const latest = arr[arr.length - 1]!;
        return { id, battery: latest.battery ?? 0 };
      })
      .filter((e) => e.battery > 0);

    if (entries.length === 0) return;

    const width = 300;
    const height = entries.length * 28 + 10;
    const margin = { top: 5, right: 40, bottom: 5, left: 80 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(entries.map((e) => e.id)).range([0, h]).padding(0.3);
    const x = d3.scaleLinear().domain([0, 100]).range([0, w]);

    const batteryColor = (val: number) => (val > 50 ? '#22c55e' : val > 20 ? '#f59e0b' : '#ef4444');

    g.selectAll('rect')
      .data(entries)
      .join('rect')
      .attr('y', (d) => y(d.id)!)
      .attr('x', 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.battery))
      .attr('fill', (d) => batteryColor(d.battery))
      .attr('rx', 3);

    g.selectAll('.label')
      .data(entries)
      .join('text')
      .attr('y', (d) => y(d.id)! + y.bandwidth() / 2)
      .attr('x', -4)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#64748b')
      .text((d) => d.id);

    g.selectAll('.value')
      .data(entries)
      .join('text')
      .attr('y', (d) => y(d.id)! + y.bandwidth() / 2)
      .attr('x', (d) => x(d.battery) + 4)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#334155')
      .text((d) => `${d.battery.toFixed(1)}%`);

    svg.attr('viewBox', `0 0 ${width} ${height}`);
  }, [deviceData, deviceIds]);

  return <svg ref={svgRef} className="w-full" />;
}

'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
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
      <div
        className="card chart-dark animate-fade-in-up p-4"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-base" aria-hidden="true">🌡️</span>
          <h3 className="text-sm font-semibold text-slate-200">Temperature history</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {deviceIds.map((id) => (
            <TemperatureChart key={id} deviceId={id} data={byDevice.get(id)!} />
          ))}
        </div>
      </div>

      {/* Humidity + Battery bars */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className="card chart-dark animate-fade-in-up p-4"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base" aria-hidden="true">💧</span>
            <h3 className="text-sm font-semibold text-slate-200">Humidity</h3>
          </div>
          <HumidityChart deviceData={byDevice} deviceIds={deviceIds} />
        </div>
        <div
          className="card chart-dark animate-fade-in-up p-4"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base" aria-hidden="true">🔋</span>
            <h3 className="text-sm font-semibold text-slate-200">Battery</h3>
          </div>
          <BatteryChart deviceData={byDevice} deviceIds={deviceIds} />
        </div>
      </div>
    </div>
  );
}

function TemperatureChart({ deviceId, data }: { deviceId: string; data: Telemetry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const width = 420;
  const height = 140;
  const margin = { top: 8, right: 12, bottom: 28, left: 40 };

  const draw = useCallback(
    (currentData: Telemetry[], xDomain?: [Date, Date]) => {
      const svg = d3.select(svgRef.current!);
      const w = width - margin.left - margin.right;
      const h = height - margin.top - margin.bottom;

      // Clear previous content inside the clip group
      svg.select('.chart-area').selectAll('*').remove();
      svg.select('.x-axis-g').selectAll('*').remove();
      svg.select('.y-axis-g').selectAll('*').remove();

      const g = svg.select<SVGGElement>('.chart-area');

      // Time scale
      const times = currentData.map((d) => new Date(d.ts));
      const xFull = d3.scaleTime()
        .domain(d3.extent(times) as [Date, Date])
        .range([0, w]);
      const x = xDomain
        ? d3.scaleTime().domain(xDomain).range([0, w])
        : xFull;

      const temps = currentData.map((d) => d.temp);
      const yMin = d3.min(temps)! - 1;
      const yMax = d3.max(temps)! + 1;
      const y = d3.scaleLinear().domain([yMin, yMax]).range([h, 0]);

      // Axes
      const xAxis = d3.axisBottom(x)
        .ticks(5)
        .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date));
      svg.select<SVGGElement>('.x-axis-g')
        .call(xAxis)
        .selectAll('text')
        .attr('fill', '#64748b')
        .attr('font-size', 9);
      svg.select('.x-axis-g').selectAll('line, path').attr('stroke', '#334155');

      const yAxis = d3.axisLeft(y).ticks(4).tickFormat((d) => `${d}°`);
      svg.select<SVGGElement>('.y-axis-g')
        .call(yAxis)
        .selectAll('text')
        .attr('fill', '#64748b')
        .attr('font-size', 9);
      svg.select('.y-axis-g').selectAll('line, path').attr('stroke', '#334155');

      // Area + line
      const area = d3.area<Telemetry>()
        .x((d) => x(new Date(d.ts)))
        .y0(h)
        .y1((d) => y(d.temp))
        .curve(d3.curveMonotoneX);

      const line = d3.line<Telemetry>()
        .x((d) => x(new Date(d.ts)))
        .y((d) => y(d.temp))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(currentData)
        .attr('d', area)
        .attr('fill', 'rgba(59, 130, 246, 0.1)');

      g.append('path')
        .datum(currentData)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 1.5);

      // Latest point
      const last = currentData[currentData.length - 1]!;
      g.append('circle')
        .attr('cx', x(new Date(last.ts)))
        .attr('cy', y(last.temp))
        .attr('r', 3)
        .attr('fill', '#3b82f6');
    },
    [margin.left, margin.right, margin.top, margin.bottom],
  );

  useEffect(() => {
    if (!svgRef.current || data.length < 2) return;

    const svg = d3.select(svgRef.current);
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // One-time scaffold
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Clip path
    svg.append('defs')
      .append('clipPath')
      .attr('id', `clip-${deviceId}`)
      .append('rect')
      .attr('width', w)
      .attr('height', h);

    const mainG = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    mainG.append('g').attr('class', 'chart-area').attr('clip-path', `url(#clip-${deviceId})`);
    mainG.append('g').attr('class', 'x-axis-g').attr('transform', `translate(0,${h})`);
    mainG.append('g').attr('class', 'y-axis-g');

    draw(data);

    // Zoom behaviour
    const times = data.map((d) => new Date(d.ts));
    const xFull = d3.scaleTime()
      .domain(d3.extent(times) as [Date, Date])
      .range([0, w]);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [w, h]])
      .extent([[0, 0], [w, h]])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const newX = event.transform.rescaleX(xFull);
        draw(data, [newX.domain()[0], newX.domain()[1]] as [Date, Date]);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    return () => {
      svg.on('.zoom', null);
    };
  }, [data, deviceId, draw]);

  const handleReset = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  const latest = data.length > 0 ? data[data.length - 1]! : null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-mono font-medium text-slate-400">{deviceId}</span>
        <div className="flex items-center gap-2">
          {latest && (
            <span className="tabular-nums text-cyan-400">{latest.temp.toFixed(1)}°C</span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
      </div>
      <div ref={containerRef} className="cursor-grab active:cursor-grabbing">
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" />
      </div>
      <p className="mt-1 text-center text-[9px] text-slate-600">Scroll to zoom · drag to pan</p>
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

  return <svg ref={svgRef} className="w-full" aria-label="Humidity chart" />;
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

  return <svg ref={svgRef} className="w-full" aria-label="Battery chart" />;
}

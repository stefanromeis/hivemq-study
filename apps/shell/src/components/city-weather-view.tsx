'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { OpenMeteoResponse } from '@/lib/open-meteo';
import { weatherCodeToInfo } from '@/lib/open-meteo';

interface Props {
  weather: OpenMeteoResponse;
  cityName: string;
}

export function CityWeatherView({ weather, cityName }: Props) {
  const { hourly } = weather;
  const hours = hourly.time.length;

  // Find the index closest to the current hour
  const nowIndex = useMemo(() => {
    const now = new Date();
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < hours; i++) {
      const diff = Math.abs(new Date(hourly.time[i]!).getTime() - now.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }, [hourly.time, hours]);

  const [selectedHour, setSelectedHour] = useState(nowIndex);

  const temp = hourly.temperature_2m[selectedHour]!;
  const feelsLike = hourly.apparent_temperature[selectedHour]!;
  const humidity = hourly.relative_humidity_2m[selectedHour]!;
  const precipitation = hourly.precipitation[selectedHour]!;
  const windSpeed = hourly.wind_speed_10m[selectedHour]!;
  const windDir = hourly.wind_direction_10m[selectedHour]!;
  const cloudCover = hourly.cloud_cover[selectedHour]!;
  const weatherCode = hourly.weather_code[selectedHour]!;
  const timeLabel = new Date(hourly.time[selectedHour]!).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const wmo = weatherCodeToInfo(weatherCode);

  return (
    <div className="space-y-6">
      {/* Current snapshot card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{wmo.emoji}</span>
              <div>
                <p className="text-3xl font-bold tabular-nums text-white">
                  {temp.toFixed(1)}°C
                </p>
                <p className="text-sm text-slate-400">{wmo.label}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">
              {timeLabel}
            </p>
            <p className="text-lg font-semibold text-slate-200">{cityName}</p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Feels like" value={`${feelsLike.toFixed(1)}°C`} />
          <StatCard label="Humidity" value={`${humidity}%`} />
          <StatCard label="Wind" value={`${windSpeed.toFixed(1)} km/h`} sub={`${windDir}°`} />
          <StatCard label="Cloud cover" value={`${cloudCover}%`} />
          <StatCard label="Precipitation" value={`${precipitation.toFixed(1)} mm`} />
        </div>
      </div>

      {/* Time slider */}
      <div className="card p-4">
        <label htmlFor="hour-slider" className="mb-2 block text-sm font-medium text-slate-300">
          Time of day
        </label>
        <div className="flex items-center gap-4">
          <span className="w-14 text-right text-xs tabular-nums text-slate-500">
            {new Date(hourly.time[0]!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <input
            id="hour-slider"
            type="range"
            min={0}
            max={hours - 1}
            value={selectedHour}
            onChange={(e) => setSelectedHour(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-500"
          />
          <span className="w-14 text-xs tabular-nums text-slate-500">
            {new Date(hourly.time[hours - 1]!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="mt-1 text-center text-sm font-medium text-cyan-400">{timeLabel}</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card chart-dark p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">🌡️ Temperature</h3>
          <HourlyLineChart
            times={hourly.time}
            values={hourly.temperature_2m}
            selectedIndex={selectedHour}
            unit="°C"
            color="#f59e0b"
          />
        </div>
        <div className="card chart-dark p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">💧 Humidity</h3>
          <HourlyLineChart
            times={hourly.time}
            values={hourly.relative_humidity_2m}
            selectedIndex={selectedHour}
            unit="%"
            color="#3b82f6"
            domain={[0, 100]}
          />
        </div>
        <div className="card chart-dark p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">💨 Wind speed</h3>
          <HourlyLineChart
            times={hourly.time}
            values={hourly.wind_speed_10m}
            selectedIndex={selectedHour}
            unit="km/h"
            color="#10b981"
          />
        </div>
        <div className="card chart-dark p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">🌧️ Precipitation</h3>
          <HourlyBarChart
            times={hourly.time}
            values={hourly.precipitation}
            selectedIndex={selectedHour}
            unit="mm"
            color="#6366f1"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-slate-800/50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// --- D3 Charts ---

interface LineChartProps {
  times: string[];
  values: number[];
  selectedIndex: number;
  unit: string;
  color: string;
  domain?: [number, number];
}

function HourlyLineChart({ times, values, selectedIndex, unit, color, domain }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 160;
    const margin = { top: 10, right: 40, bottom: 24, left: 10 };
    const inner = { w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };

    const x = d3.scaleLinear().domain([0, times.length - 1]).range([0, inner.w]);
    const yMin = domain ? domain[0] : d3.min(values) ?? 0;
    const yMax = domain ? domain[1] : d3.max(values) ?? 1;
    const pad = domain ? 0 : (yMax - yMin) * 0.1 || 1;
    const y = d3.scaleLinear().domain([yMin - pad, yMax + pad]).range([inner.h, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis (hours)
    const tickIndices = times
      .map((t, i) => ({ i, h: new Date(t).getHours() }))
      .filter((d) => d.h % 3 === 0);

    g.append('g')
      .attr('transform', `translate(0,${inner.h})`)
      .call(
        d3.axisBottom(x)
          .tickValues(tickIndices.map((d) => d.i))
          .tickFormat((d) => {
            const h = new Date(times[d as number]!).getHours();
            return `${h}:00`;
          })
          .tickSize(0),
      )
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', 10);

    // Y axis (right)
    g.append('g')
      .attr('transform', `translate(${inner.w},0)`)
      .call(d3.axisRight(y).ticks(4).tickSize(0).tickFormat((d) => `${d}`))
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', 10);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(4).tickSize(-inner.w).tickFormat(() => ''))
      .call((g) => g.select('.domain').remove())
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '2,3');

    // Line
    const line = d3.line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(values)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Area fill
    const area = d3.area<number>()
      .x((_, i) => x(i))
      .y0(inner.h)
      .y1((d) => y(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(values)
      .attr('fill', color)
      .attr('opacity', 0.08)
      .attr('d', area);

    // Selected hour marker
    g.append('line')
      .attr('x1', x(selectedIndex))
      .attr('x2', x(selectedIndex))
      .attr('y1', 0)
      .attr('y2', inner.h)
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3');

    g.append('circle')
      .attr('cx', x(selectedIndex))
      .attr('cy', y(values[selectedIndex]!))
      .attr('r', 4)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', x(selectedIndex))
      .attr('y', y(values[selectedIndex]!) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .text(`${values[selectedIndex]!.toFixed(1)}${unit}`);
  }, [times, values, selectedIndex, unit, color, domain]);

  return <svg ref={svgRef} className="h-[160px] w-full" />;
}

interface BarChartProps {
  times: string[];
  values: number[];
  selectedIndex: number;
  unit: string;
  color: string;
}

function HourlyBarChart({ times, values, selectedIndex, unit, color }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 160;
    const margin = { top: 10, right: 40, bottom: 24, left: 10 };
    const inner = { w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };

    const x = d3.scaleBand<number>()
      .domain(d3.range(times.length))
      .range([0, inner.w])
      .padding(0.2);

    const yMax = Math.max(d3.max(values) ?? 0, 0.5);
    const y = d3.scaleLinear().domain([0, yMax]).range([inner.h, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    const tickIndices = times
      .map((t, i) => ({ i, h: new Date(t).getHours() }))
      .filter((d) => d.h % 3 === 0);

    g.append('g')
      .attr('transform', `translate(0,${inner.h})`)
      .call(
        d3.axisBottom(x)
          .tickValues(tickIndices.map((d) => d.i))
          .tickFormat((d) => {
            const h = new Date(times[d as number]!).getHours();
            return `${h}:00`;
          })
          .tickSize(0),
      )
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', 10);

    // Y axis
    g.append('g')
      .attr('transform', `translate(${inner.w},0)`)
      .call(d3.axisRight(y).ticks(3).tickSize(0).tickFormat((d) => `${d}`))
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', 10);

    // Bars
    g.selectAll('rect')
      .data(values)
      .join('rect')
      .attr('x', (_, i) => x(i)!)
      .attr('y', (d) => y(d))
      .attr('width', x.bandwidth())
      .attr('height', (d) => inner.h - y(d))
      .attr('fill', (_, i) => (i === selectedIndex ? '#06b6d4' : color))
      .attr('opacity', (_, i) => (i === selectedIndex ? 1 : 0.5))
      .attr('rx', 1);

    // Selected value label
    if (values[selectedIndex]! > 0) {
      g.append('text')
        .attr('x', x(selectedIndex)! + x.bandwidth() / 2)
        .attr('y', y(values[selectedIndex]!) - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', 11)
        .attr('font-weight', 600)
        .text(`${values[selectedIndex]!.toFixed(1)}${unit}`);
    }
  }, [times, values, selectedIndex, unit, color]);

  return <svg ref={svgRef} className="h-[160px] w-full" />;
}

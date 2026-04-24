import type { HourlyWeather } from './open-meteo';
import { weatherCodeToInfo } from './open-meteo';

export type Status = 'green' | 'orange' | 'red';

export interface AnalysisItem {
  category: string;
  icon: string;
  status: Status;
  headline: string;
  detail: string;
}

export interface WeatherAnalysis {
  overall: Status;
  summary: string;
  items: AnalysisItem[];
}

/** Derive the worst status from a set of statuses */
function worstStatus(statuses: Status[]): Status {
  if (statuses.includes('red')) return 'red';
  if (statuses.includes('orange')) return 'orange';
  return 'green';
}

function analyzeTemperature(hourly: HourlyWeather): AnalysisItem {
  const temps = hourly.temperature_2m;
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  const feelsLike = hourly.apparent_temperature;
  const minFeels = Math.min(...feelsLike);
  const maxFeels = Math.max(...feelsLike);

  let status: Status = 'green';
  let headline = 'Temperature normal';
  let detail = `Ranging from ${min.toFixed(1)}°C to ${max.toFixed(1)}°C (avg ${avg.toFixed(1)}°C). `;

  if (max >= 38) {
    status = 'red';
    headline = 'Extreme heat warning';
    detail += `Peak of ${max.toFixed(1)}°C — dangerous heat levels. Stay hydrated, avoid outdoor activity.`;
  } else if (max >= 33) {
    status = 'orange';
    headline = 'High temperatures expected';
    detail += `Peak of ${max.toFixed(1)}°C — consider limiting outdoor exposure during midday.`;
  } else if (min <= -15) {
    status = 'red';
    headline = 'Extreme cold warning';
    detail += `Low of ${min.toFixed(1)}°C — risk of frostbite. Dress in layers.`;
  } else if (min <= -5) {
    status = 'orange';
    headline = 'Cold conditions';
    detail += `Low of ${min.toFixed(1)}°C — freezing temperatures expected.`;
  } else {
    detail += 'Within comfortable range.';
  }

  if (maxFeels - max > 3) {
    detail += ` Feels-like temperature peaks at ${maxFeels.toFixed(1)}°C due to humidity.`;
  } else if (minFeels - min < -3) {
    detail += ` Wind chill makes it feel as cold as ${minFeels.toFixed(1)}°C.`;
  }

  return { category: 'Temperature', icon: '🌡️', status, headline, detail };
}

function analyzePrecipitation(hourly: HourlyWeather): AnalysisItem {
  const precip = hourly.precipitation;
  const totalMm = precip.reduce((a, b) => a + b, 0);
  const maxHourly = Math.max(...precip);
  const rainyHours = precip.filter((p) => p > 0.1).length;

  let status: Status = 'green';
  let headline = 'No significant precipitation';
  let detail = '';

  if (totalMm < 0.5) {
    detail = 'Dry conditions throughout the day.';
  } else if (maxHourly >= 10) {
    status = 'red';
    headline = 'Heavy rainfall expected';
    detail = `Up to ${maxHourly.toFixed(1)} mm/h — risk of local flooding. Total: ${totalMm.toFixed(1)} mm over ${rainyHours}h.`;
  } else if (totalMm >= 10 || maxHourly >= 4) {
    status = 'orange';
    headline = 'Moderate rainfall';
    detail = `Total ${totalMm.toFixed(1)} mm expected over ${rainyHours}h. Peak intensity: ${maxHourly.toFixed(1)} mm/h. Carry an umbrella.`;
  } else {
    headline = 'Light precipitation';
    detail = `${totalMm.toFixed(1)} mm total over ${rainyHours}h. Mostly light.`;
  }

  return { category: 'Precipitation', icon: '🌧️', status, headline, detail };
}

function analyzeWind(hourly: HourlyWeather): AnalysisItem {
  const wind = hourly.wind_speed_10m;
  const max = Math.max(...wind);
  const avg = wind.reduce((a, b) => a + b, 0) / wind.length;

  let status: Status = 'green';
  let headline = 'Calm to light winds';
  let detail = `Average ${avg.toFixed(0)} km/h, gusts up to ${max.toFixed(0)} km/h.`;

  if (max >= 75) {
    status = 'red';
    headline = 'Storm-force winds';
    detail = `Gusts up to ${max.toFixed(0)} km/h — secure loose objects, avoid travel if possible.`;
  } else if (max >= 50) {
    status = 'orange';
    headline = 'Strong winds expected';
    detail = `Gusts up to ${max.toFixed(0)} km/h — may affect outdoor activities and high-profile vehicles.`;
  } else if (max >= 30) {
    headline = 'Moderate breezes';
    detail += ' Noticeable but manageable.';
  }

  return { category: 'Wind', icon: '💨', status, headline, detail };
}

function analyzeWeatherCodes(hourly: HourlyWeather): AnalysisItem {
  const codes = hourly.weather_code;
  const uniqueCodes = [...new Set(codes)];

  const severeThunderstorm = codes.some((c) => c >= 95);
  const freezingPrecip = codes.some((c) => c === 56 || c === 57 || c === 66 || c === 67);
  const heavySnow = codes.some((c) => c === 75 || c === 86);
  const fog = codes.some((c) => c === 45 || c === 48);

  // Build conditions summary
  const conditions = uniqueCodes
    .sort((a, b) => b - a) // most severe first
    .slice(0, 4)
    .map((c) => {
      const info = weatherCodeToInfo(c);
      return `${info.emoji} ${info.label}`;
    });

  let status: Status = 'green';
  let headline = 'Fair conditions';
  let detail = `Expected conditions: ${conditions.join(', ')}.`;

  if (severeThunderstorm) {
    status = 'red';
    headline = 'Thunderstorm activity';
    detail = `⚡ Thunderstorms expected — seek shelter when lightning is observed. ${detail}`;
  } else if (freezingPrecip) {
    status = 'red';
    headline = 'Freezing precipitation';
    detail = `🧊 Freezing rain/drizzle — extremely slippery roads. ${detail}`;
  } else if (heavySnow) {
    status = 'orange';
    headline = 'Heavy snowfall';
    detail = `❄️ Significant snow accumulation expected. ${detail}`;
  } else if (fog) {
    status = 'orange';
    headline = 'Reduced visibility';
    detail = `🌫️ Fog periods expected — drive carefully. ${detail}`;
  } else {
    const worstCode = Math.max(...codes);
    if (worstCode >= 61) {
      headline = 'Unsettled weather';
    } else if (worstCode >= 3) {
      headline = 'Mostly cloudy';
    }
  }

  return { category: 'Conditions', icon: '🌤️', status, headline, detail };
}

function analyzeHumidity(hourly: HourlyWeather): AnalysisItem {
  const hum = hourly.relative_humidity_2m;
  const avg = hum.reduce((a, b) => a + b, 0) / hum.length;
  const max = Math.max(...hum);

  let status: Status = 'green';
  let headline = 'Comfortable humidity';
  let detail = `Average ${avg.toFixed(0)}%, peak ${max}%.`;

  if (avg >= 85) {
    status = 'orange';
    headline = 'Very high humidity';
    detail += ' Feels muggy — high moisture levels throughout the day.';
  } else if (avg <= 25) {
    status = 'orange';
    headline = 'Very dry air';
    detail += ' Low humidity — stay hydrated, moisturize skin.';
  } else {
    detail += ' Within comfortable range.';
  }

  return { category: 'Humidity', icon: '💧', status, headline, detail };
}

function analyzeCloudCover(hourly: HourlyWeather): AnalysisItem {
  const clouds = hourly.cloud_cover;
  const avg = clouds.reduce((a, b) => a + b, 0) / clouds.length;
  const clearHours = clouds.filter((c) => c < 20).length;
  const overcastHours = clouds.filter((c) => c > 80).length;

  let status: Status = 'green';
  let headline: string;
  let detail: string;

  if (avg < 25) {
    headline = 'Mostly sunny';
    detail = `${clearHours}h of clear skies expected. Great for outdoor activities.`;
  } else if (avg < 60) {
    headline = 'Partly cloudy';
    detail = `Mix of sun and clouds — ${clearHours}h clear, ${overcastHours}h overcast.`;
  } else {
    headline = 'Mostly overcast';
    detail = `${overcastHours}h of heavy cloud cover. Limited sunshine.`;
    if (overcastHours >= 18) {
      status = 'orange';
      headline = 'Persistent cloud cover';
    }
  }

  return { category: 'Cloud Cover', icon: '☁️', status, headline, detail };
}

/** Run all analysis modules and produce a combined report. */
export function analyzeWeather(hourly: HourlyWeather): WeatherAnalysis {
  const items = [
    analyzeWeatherCodes(hourly),
    analyzeTemperature(hourly),
    analyzePrecipitation(hourly),
    analyzeWind(hourly),
    analyzeHumidity(hourly),
    analyzeCloudCover(hourly),
  ];

  const overall = worstStatus(items.map((i) => i.status));

  // Build summary
  const redItems = items.filter((i) => i.status === 'red');
  const orangeItems = items.filter((i) => i.status === 'orange');

  let summary: string;
  if (overall === 'red') {
    summary = `⚠️ Weather alerts active: ${redItems.map((i) => i.headline).join('; ')}. Exercise caution.`;
  } else if (overall === 'orange') {
    summary = `⚡ Some weather concerns: ${orangeItems.map((i) => i.headline).join('; ')}. Stay informed.`;
  } else {
    summary = '✅ All weather parameters within normal ranges. No significant concerns for the next 24 hours.';
  }

  return { overall, summary, items };
}

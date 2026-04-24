export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  cloud_cover: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds: number;
  hourly: HourlyWeather;
}

const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'cloud_cover',
].join(',');

/**
 * Fetch 24h hourly forecast for a given lat/lon from Open-Meteo.
 * Free, no API key needed.
 */
export async function fetchHourlyWeather(
  lat: number,
  lon: number,
): Promise<OpenMeteoResponse> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=${HOURLY_VARS}` +
    `&timezone=auto&forecast_days=1`;

  const res = await fetch(url, { next: { revalidate: 900 } }); // cache 15 min
  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }
  return res.json();
}

/** WMO weather codes → emoji + label */
const WMO_CODES: Record<number, { emoji: string; label: string }> = {
  0: { emoji: '☀️', label: 'Clear sky' },
  1: { emoji: '🌤️', label: 'Mainly clear' },
  2: { emoji: '⛅', label: 'Partly cloudy' },
  3: { emoji: '☁️', label: 'Overcast' },
  45: { emoji: '🌫️', label: 'Fog' },
  48: { emoji: '🌫️', label: 'Rime fog' },
  51: { emoji: '🌦️', label: 'Light drizzle' },
  53: { emoji: '🌦️', label: 'Moderate drizzle' },
  55: { emoji: '🌦️', label: 'Dense drizzle' },
  61: { emoji: '🌧️', label: 'Slight rain' },
  63: { emoji: '🌧️', label: 'Moderate rain' },
  65: { emoji: '🌧️', label: 'Heavy rain' },
  71: { emoji: '🌨️', label: 'Slight snow' },
  73: { emoji: '🌨️', label: 'Moderate snow' },
  75: { emoji: '❄️', label: 'Heavy snow' },
  77: { emoji: '🌨️', label: 'Snow grains' },
  80: { emoji: '🌦️', label: 'Slight showers' },
  81: { emoji: '🌧️', label: 'Moderate showers' },
  82: { emoji: '🌧️', label: 'Violent showers' },
  85: { emoji: '🌨️', label: 'Slight snow showers' },
  86: { emoji: '🌨️', label: 'Heavy snow showers' },
  95: { emoji: '⛈️', label: 'Thunderstorm' },
  96: { emoji: '⛈️', label: 'Thunderstorm with hail' },
  99: { emoji: '⛈️', label: 'Thunderstorm with heavy hail' },
};

export function weatherCodeToInfo(code: number) {
  return WMO_CODES[code] ?? { emoji: '❓', label: `Code ${code}` };
}

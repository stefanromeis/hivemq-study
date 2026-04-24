export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { id: 'vienna', name: 'Vienna', lat: 48.21, lon: 16.37 },
  { id: 'berlin', name: 'Berlin', lat: 52.52, lon: 13.41 },
  { id: 'london', name: 'London', lat: 51.51, lon: -0.13 },
  { id: 'new-york', name: 'New York', lat: 40.71, lon: -74.01 },
  { id: 'tokyo', name: 'Tokyo', lat: 35.68, lon: 139.69 },
];

export const CITIES_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c])) as Record<string, City>;

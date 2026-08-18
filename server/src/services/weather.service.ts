import { env } from '../config/env.js';
import { Township } from '../models/Township.js';
import { AppError } from '../utils/AppError.js';

type CacheEntry = { expiresAt: number; data: unknown };
const cache = new Map<string, CacheEntry>();

export type OpenMeteoPayload = {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
    apparent_temperature?: number;
    dew_point_2m?: number;
    uv_index?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
};

export type WeatherAlert = {
  level: 'critical' | 'moderate' | 'low' | 'info';
  type: string;
  title: string;
  date: string;
  message: string;
  issuedAgo: string;
  affectedTownships: string[];
};

export type FarmingTip = {
  kind: 'good' | 'warning' | 'tip';
  text: string;
};

export type CropRecommendations = {
  rice: FarmingTip[];
  onion: FarmingTip[];
};

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setCache(key: string, data: unknown, ttlSeconds = env.WEATHER_CACHE_TTL_SECONDS) {
  cache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    data,
  });
}

async function fetchWithTimeout(url: URL | string, timeoutMs = env.WEATHER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function yangonDateOffset(offsetDays: number) {
  const [y, m, d] = yangonToday().split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + offsetDays)).toISOString().slice(0, 10);
}

/** Typical Myanmar climate when Open-Meteo is blocked (no VPN). */
function seasonalFallback(lat: number, lng: number): OpenMeteoPayload {
  const month = Number(yangonToday().slice(5, 7));
  const south = lat < 18;
  const monsoon = month >= 5 && month <= 10;
  const hot = month >= 3 && month <= 4;
  const climate = monsoon
    ? { high: south ? 31 : 32, low: south ? 24 : 23, humidity: 82, rain: south ? 14 : 8, chance: south ? 70 : 55, code: 61, wind: 12, uv: 6 }
    : hot
      ? { high: 38, low: 26, humidity: 55, rain: 1, chance: 15, code: 1, wind: 10, uv: 10 }
      : { high: 30, low: 16, humidity: 50, rain: 0, chance: 10, code: 1, wind: 8, uv: 8 };

  const times = Array.from({ length: 14 }, (_, i) => yangonDateOffset(i - 7));
  const today = times[7] || yangonToday();

  return {
    latitude: lat,
    longitude: lng,
    timezone: 'Asia/Yangon',
    current: {
      time: `${today}T12:00`,
      temperature_2m: climate.high - 2,
      relative_humidity_2m: climate.humidity,
      precipitation: climate.rain > 4 ? 0.4 : 0,
      weather_code: climate.code,
      wind_speed_10m: climate.wind,
      wind_direction_10m: 180,
      wind_gusts_10m: climate.wind + 4,
      apparent_temperature: climate.high,
      dew_point_2m: Math.round(climate.low + (climate.humidity / 20)),
      uv_index: climate.uv,
    },
    daily: {
      time: times,
      weather_code: times.map((_, i) => (i % 4 === 0 && monsoon ? 63 : climate.code)),
      temperature_2m_max: times.map((_, i) => climate.high + (i % 3) - 1),
      temperature_2m_min: times.map((_, i) => climate.low + (i % 2)),
      precipitation_sum: times.map((_, i) => Math.max(0, climate.rain + (i % 3) - 1)),
      precipitation_probability_max: times.map(() => climate.chance),
      wind_speed_10m_max: times.map(() => climate.wind + 3),
      sunrise: times.map((d) => `${d}T05:45`),
      sunset: times.map((d) => `${d}T18:30`),
      uv_index_max: times.map(() => climate.uv),
    },
  };
}

type WeatherFetch = { data: OpenMeteoPayload; cached: boolean; offline: boolean };

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherFetch> {
  const key = `wx:${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = getCached<WeatherFetch>(key);
  if (cached?.data) return { ...cached, cached: true };

  const url = new URL(`${env.WEATHER_API_URL}/forecast`);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'apparent_temperature',
      'dew_point_2m',
      'uv_index',
    ].join(',')
  );
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'sunrise',
      'sunset',
      'uv_index_max',
    ].join(',')
  );
  url.searchParams.set('timezone', 'Asia/Yangon');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('past_days', '7');

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const data = (await res.json()) as OpenMeteoPayload;
    const live: WeatherFetch = { data, cached: false, offline: false };
    setCache(key, live);
    return live;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[weather] Open-Meteo unreachable (${msg}); using seasonal Myanmar estimate`);
    const offline: WeatherFetch = { data: seasonalFallback(lat, lng), cached: false, offline: true };
    setCache(key, offline, 60);
    return offline;
  }
}

function windLabel(speed?: number) {
  if (speed == null) return '—';
  if (speed < 5) return 'Calm';
  if (speed < 12) return 'Gentle';
  if (speed < 20) return 'Moderate';
  if (speed < 30) return 'Fresh';
  return 'Strong';
}

function humidityComfort(h?: number) {
  if (h == null) return '—';
  if (h < 40) return 'Dry';
  if (h <= 70) return 'Comfortable';
  return 'Humid';
}

function uvLabel(uv?: number) {
  if (uv == null) return '—';
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very high';
  return 'Extreme';
}

function windDirection(deg?: number) {
  if (deg == null) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function buildAlerts(data: OpenMeteoPayload, region = 'Myanmar'): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const days = data.daily?.time ?? [];
  const start = todayIndex(days);
  const today = days[start] || yangonToday();
  const window = days.slice(start, start + 7);

  window.forEach((date, offset) => {
    const i = start + offset;
    const rain = data.daily?.precipitation_sum?.[i] ?? 0;
    const rainChance = data.daily?.precipitation_probability_max?.[i] ?? 0;
    const wind = data.daily?.wind_speed_10m_max?.[i] ?? 0;
    const dayLabel = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : date;

    if (rain >= 40 || rainChance >= 85) {
      alerts.push({
        level: rain >= 60 ? 'critical' : 'moderate',
        type: 'heavy_rain',
        title: `Heavy rain — ${region}`,
        date,
        message: `Heavy rain expected ${dayLabel} (${rain.toFixed(1)} mm, ~${rainChance}% chance). Prepare for possible flooding in low-lying areas.`,
        issuedAgo: offset === 0 ? 'Updated just now' : `Forecast day +${offset}`,
        affectedTownships: [region],
      });
    } else if (rain >= 15 || rainChance >= 60) {
      alerts.push({
        level: 'low',
        type: 'rain',
        title: `Rain likely — ${region}`,
        date,
        message: `Showers expected ${dayLabel} (${rain.toFixed(1)} mm). Delay irrigation if soils stay wet.`,
        issuedAgo: `Forecast day +${offset}`,
        affectedTownships: [region],
      });
    }

    if (wind >= 45) {
      alerts.push({
        level: wind >= 60 ? 'critical' : 'moderate',
        type: 'storm',
        title: `Strong wind — ${region}`,
        date,
        message: `High winds expected ${dayLabel} (up to ${wind.toFixed(0)} km/h). Secure loose objects and young plants.`,
        issuedAgo: `Forecast day +${offset}`,
        affectedTownships: [region],
      });
    } else if (wind >= 30) {
      alerts.push({
        level: 'low',
        type: 'wind',
        title: `Breezy conditions — ${region}`,
        date,
        message: `Gusty winds up to ${wind.toFixed(0)} km/h ${dayLabel}. Secure lightweight covers.`,
        issuedAgo: `Forecast day +${offset}`,
        affectedTownships: [region],
      });
    }
  });

  // Keep unique-ish short list
  const deduped = alerts.slice(0, 4);
  if (deduped.length === 0) {
    deduped.push({
      level: 'info',
      type: 'clear',
      title: `No severe alerts — ${region}`,
      date: today,
      message: 'Conditions look manageable for field work. Keep checking the 7-day forecast before spraying.',
      issuedAgo: 'Updated just now',
      affectedTownships: [region],
    });
  }
  return deduped;
}

function buildRecommendations(data: OpenMeteoPayload): CropRecommendations {
  const d0 = todayIndex(data.daily?.time ?? []);
  const rainTomorrow = data.daily?.precipitation_sum?.[d0 + 1] ?? 0;
  const rainChanceTomorrow = data.daily?.precipitation_probability_max?.[d0 + 1] ?? 0;
  const temp = data.current?.temperature_2m ?? data.daily?.temperature_2m_max?.[d0] ?? 30;
  const humidity = data.current?.relative_humidity_2m ?? 60;
  const wind = data.current?.wind_speed_10m ?? 0;

  const rice: FarmingTip[] = [];

  if (temp >= 24 && temp <= 34 && rainTomorrow < 20) {
    rice.push({ kind: 'good', text: 'Good conditions for transplanting rice seedlings.' });
  } else {
    rice.push({ kind: 'tip', text: 'Prefer cooler morning hours for transplanting if heat stays high.' });
  }

  if (rainTomorrow >= 10 || rainChanceTomorrow >= 50) {
    rice.push({ kind: 'warning', text: 'Monitor for fungal diseases due to upcoming rain.' });
    rice.push({ kind: 'tip', text: 'Apply preventive fungicide before the wetter day if leaves stay damp.' });
    rice.push({ kind: 'tip', text: 'After rain, also scout for stem borer and leaf folder damage.' });
  } else {
    rice.push({ kind: 'tip', text: 'Scout leaf tips twice this week for early Brown Spot / Blast signs.' });
  }

  if (humidity >= 75 && temp >= 28) {
    rice.push({ kind: 'warning', text: 'Warm humid weather — watch for brown planthopper at the plant base.' });
  }

  if (wind >= 25) {
    rice.push({ kind: 'warning', text: 'Gusty wind — postpone spraying until calmer.' });
  }

  return { rice, onion: [] };
}

function yangonToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Yangon' });
}

function todayIndex(times: string[]) {
  const today = yangonToday();
  const idx = times.indexOf(today);
  if (idx >= 0) return idx;
  return Math.max(0, times.length - 7);
}

function historySeries(data: OpenMeteoPayload) {
  const times = data.daily?.time ?? [];
  const highs = data.daily?.temperature_2m_max ?? [];
  const lows = data.daily?.temperature_2m_min ?? [];
  const rain = data.daily?.precipitation_sum ?? [];
  const end = todayIndex(times) + 1;
  const start = Math.max(0, end - 7);

  const points = times.slice(start, end).map((date, offset) => {
    const i = start + offset;
    return {
      date,
      high: highs[i] ?? null,
      low: lows[i] ?? null,
      rain: rain[i] ?? 0,
    };
  });

  const rainTotal = points.reduce((n, p) => n + (p.rain || 0), 0);
  const avgTemps = points
    .map((p) => (p.high != null && p.low != null ? (p.high + p.low) / 2 : p.high ?? p.low))
    .filter((n): n is number => n != null);
  const avgTemp = avgTemps.length
    ? Math.round((avgTemps.reduce((a, b) => a + b, 0) / avgTemps.length) * 10) / 10
    : null;

  return { points, rainTotal: Math.round(rainTotal * 10) / 10, avgTemp };
}

function enrichSummary(data: OpenMeteoPayload) {
  const c = data.current || {};
  const d0 = todayIndex(data.daily?.time ?? []);
  return {
    temperature: c.temperature_2m ?? null,
    feelsLike: c.apparent_temperature ?? null,
    humidity: c.relative_humidity_2m ?? null,
    humidityLabel: humidityComfort(c.relative_humidity_2m),
    precipitation: c.precipitation ?? 0,
    rainChance: data.daily?.precipitation_probability_max?.[d0] ?? 0,
    rain24h: data.daily?.precipitation_sum?.[d0] ?? 0,
    windSpeed: c.wind_speed_10m ?? null,
    windGusts: c.wind_gusts_10m ?? null,
    windDirection: windDirection(c.wind_direction_10m),
    windLabel: windLabel(c.wind_speed_10m),
    weatherCode: c.weather_code ?? data.daily?.weather_code?.[d0] ?? 0,
    dewPoint: c.dew_point_2m ?? null,
    uvIndex: c.uv_index ?? data.daily?.uv_index_max?.[d0] ?? null,
    uvLabel: uvLabel(c.uv_index ?? data.daily?.uv_index_max?.[d0]),
    high: data.daily?.temperature_2m_max?.[d0] ?? null,
    low: data.daily?.temperature_2m_min?.[d0] ?? null,
    sunrise: data.daily?.sunrise?.[d0] ?? null,
    sunset: data.daily?.sunset?.[d0] ?? null,
    updatedAt: c.time ?? null,
  };
}

function dailyForecast(data: OpenMeteoPayload) {
  const times = data.daily?.time ?? [];
  const start = todayIndex(times);
  return times.slice(start, start + 7).map((date, idx) => {
    const i = start + idx;
    return {
      date,
      weatherCode: data.daily?.weather_code?.[i] ?? 0,
      high: data.daily?.temperature_2m_max?.[i] ?? null,
      low: data.daily?.temperature_2m_min?.[i] ?? null,
      rainSum: data.daily?.precipitation_sum?.[i] ?? 0,
      rainChance: data.daily?.precipitation_probability_max?.[i] ?? 0,
      windMax: data.daily?.wind_speed_10m_max?.[i] ?? null,
      uvMax: data.daily?.uv_index_max?.[i] ?? null,
      sunrise: data.daily?.sunrise?.[i] ?? null,
      sunset: data.daily?.sunset?.[i] ?? null,
    };
  });
}

export async function getForecast(lat: number, lng: number) {
  const { data, cached, offline } = await fetchOpenMeteo(lat, lng);
  return {
    forecast: data,
    summary: enrichSummary(data),
    daily: dailyForecast(data),
    history: historySeries(data),
    recommendations: buildRecommendations(data),
    alerts: buildAlerts(data),
    cached,
    offline,
  };
}

export async function getCurrent(lat: number, lng: number) {
  const { data, cached, offline } = await fetchOpenMeteo(lat, lng);
  return { current: data.current ?? null, summary: enrichSummary(data), cached, offline };
}

export async function getAlerts(lat: number, lng: number) {
  const { data, cached, offline } = await fetchOpenMeteo(lat, lng);
  return { alerts: buildAlerts(data), cached, offline };
}

export async function getRecommendations(lat: number, lng: number) {
  const { data, cached, offline } = await fetchOpenMeteo(lat, lng);
  return { recommendations: buildRecommendations(data), cached, offline };
}

type PlaceResult = {
  id?: string | number;
  name: string;
  nameEn: string;
  nameMy?: string;
  region: string;
  lat: number;
  lng: number;
  coordinates: { type: 'Point'; coordinates: [number, number] };
  source: 'local' | 'geocode';
};

type GeocodeHit = {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  admin1?: string;
  admin2?: string;
  country_code?: string;
};

async function geocodeMyanmar(search: string, count = 40): Promise<PlaceResult[]> {
  const q = search.trim();
  if (!q || q.length < 2) return [];

  const cacheKey = `geo:mm:${q.toLowerCase()}:${count}`;
  const cached = getCached<PlaceResult[]>(cacheKey);
  if (cached) return cached;

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', q);
  url.searchParams.set('count', String(count));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  url.searchParams.set('countryCode', 'MM');

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];

    const json = (await res.json()) as { results?: GeocodeHit[] };
    const places = (json.results || [])
      .filter((r) => r.latitude != null && r.longitude != null && r.name)
      .map((r) => {
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        const region = r.admin1 || r.admin2 || 'Myanmar';
        return {
          id: r.id,
          name: r.name as string,
          nameEn: r.name as string,
          region,
          lat,
          lng,
          coordinates: { type: 'Point' as const, coordinates: [lng, lat] as [number, number] },
          source: 'geocode' as const,
        };
      });

    setCache(cacheKey, places);
    return places;
  } catch {
    return [];
  }
}

/** Resolve a human place name for GPS coordinates (Open-Meteo reverse). */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ name: string; nameEn: string; region: string; lat: number; lng: number } | null> {
  const cacheKey = `rev:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  const cached = getCached<{ name: string; nameEn: string; region: string; lat: number; lng: number }>(
    cacheKey
  );
  if (cached) return cached;

  const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  url.searchParams.set('count', '1');

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: GeocodeHit[] };
    const hit = json.results?.[0];
    if (!hit?.name || hit.latitude == null || hit.longitude == null) return null;
    const place = {
      name: hit.name,
      nameEn: hit.name,
      region: hit.admin1 || hit.admin2 || 'Myanmar',
      lat: Number(hit.latitude),
      lng: Number(hit.longitude),
    };
    setCache(cacheKey, place);
    return place;
  } catch {
    return null;
  }
}

function mapLocalTownship(t: {
  name: string;
  nameEn: string;
  nameMy?: string;
  region: string;
  coordinates?: { coordinates?: number[] };
}): PlaceResult | null {
  const coords = t.coordinates?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  return {
    name: t.name,
    nameEn: t.nameEn || t.name,
    nameMy: t.nameMy,
    region: t.region || 'Myanmar',
    lat,
    lng,
    coordinates: { type: 'Point', coordinates: [lng, lat] },
    source: 'local',
  };
}

function mergePlaces(local: PlaceResult[], remote: PlaceResult[]) {
  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const p of [...local, ...remote]) {
    const key = `${p.nameEn.toLowerCase()}|${p.lat.toFixed(2)}|${p.lng.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export async function listTownships(search?: string) {
  const q = search?.trim();

  const localFilter = q
    ? {
        isActive: true,
        $or: [
          { name: new RegExp(q, 'i') },
          { nameEn: new RegExp(q, 'i') },
          { nameMy: new RegExp(q, 'i') },
          { region: new RegExp(q, 'i') },
        ],
      }
    : { isActive: true };

  const rows = await Township.find(localFilter).sort({ nameEn: 1 }).limit(200).lean();
  const local = rows
    .map((t) =>
      mapLocalTownship({
        name: t.name,
        nameEn: t.nameEn,
        nameMy: t.nameMy,
        region: t.region,
        coordinates: t.coordinates as { coordinates?: number[] },
      })
    )
    .filter((p): p is PlaceResult => Boolean(p));

  // Country-wide search via Open-Meteo geocoding (Myanmar only)
  if (q && q.length >= 2) {
    try {
      const remote = await geocodeMyanmar(q, 40);
      return mergePlaces(local, remote);
    } catch {
      return local;
    }
  }

  return local;
}

async function weatherBundleForPlace(place: {
  name: string;
  nameEn: string;
  nameMy?: string;
  region: string;
  lat: number;
  lng: number;
}) {
  const { data, cached, offline } = await fetchOpenMeteo(place.lat, place.lng);
  const region = place.region || place.nameEn || place.name;
  return {
    township: {
      name: place.name,
      nameEn: place.nameEn,
      nameMy: place.nameMy,
      region,
      coordinates: { type: 'Point' as const, coordinates: [place.lng, place.lat] as [number, number] },
      lat: place.lat,
      lng: place.lng,
    },
    weather: data,
    summary: enrichSummary(data),
    daily: dailyForecast(data),
    history: historySeries(data),
    recommendations: buildRecommendations(data),
    alerts: buildAlerts(data, region),
    cached,
    offline,
  };
}

export async function getByCoords(lat: number, lng: number, name?: string, region?: string) {
  // Prefer the nearest known township so weather stays township-specific.
  try {
    const nearest = await Township.findOne({
      isActive: true,
      coordinates: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 100_000,
        },
      },
    });
    if (nearest?.coordinates?.coordinates) {
      const [tLng, tLat] = nearest.coordinates.coordinates;
      return weatherBundleForPlace({
        name: nearest.name,
        nameEn: nearest.nameEn,
        nameMy: nearest.nameMy,
        region: nearest.region,
        lat: tLat,
        lng: tLng,
      });
    }
  } catch {
    /* fall through to reverse geocode */
  }

  const reversed = await reverseGeocode(lat, lng);
  const label = reversed?.nameEn || reversed?.name || name?.trim() || 'Selected location';
  return weatherBundleForPlace({
    name: label,
    nameEn: label,
    region: reversed?.region || region?.trim() || 'Myanmar',
    lat: reversed?.lat ?? lat,
    lng: reversed?.lng ?? lng,
  });
}

export async function getByTownship(townshipName: string) {
  const township = await Township.findOne({
    isActive: true,
    $or: [
      { name: new RegExp(`^${townshipName}$`, 'i') },
      { nameEn: new RegExp(`^${townshipName}$`, 'i') },
      { nameMy: townshipName },
    ],
  });

  if (township?.coordinates?.coordinates) {
    const [lng, lat] = township.coordinates.coordinates;
    return weatherBundleForPlace({
      name: township.name,
      nameEn: township.nameEn,
      nameMy: township.nameMy,
      region: township.region,
      lat,
      lng,
    });
  }

  // Fall back to country-wide geocoding so any Myanmar place works
  const hits = await geocodeMyanmar(townshipName, 8);
  const exact =
    hits.find((h) => h.nameEn.toLowerCase() === townshipName.trim().toLowerCase()) || hits[0];
  if (!exact) {
    throw new AppError('Township not found in Myanmar', 404);
  }

  return weatherBundleForPlace(exact);
}

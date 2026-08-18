import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLanguage, type Lang } from '../context/LanguageContext';
import { api } from '../services/api';
import { formatRegionLabel, formatTownshipLabel } from '../utils/localizeFarm';
import { readPreferredTownship, writePreferredTownship } from '../utils/preferredTownship';
type Tone = 'mint' | 'sky' | 'coral' | 'amber' | 'peach' | 'teal';

type Township = {
  id?: string | number;
  name: string;
  nameEn: string;
  nameMy?: string;
  region: string;
  lat?: number;
  lng?: number;
  coordinates?: { coordinates?: [number, number] };
  source?: 'local' | 'geocode';
};

type DayForecast = {
  date: string;
  weatherCode: number;
  high: number | null;
  low: number | null;
  rainSum: number;
  rainChance: number;
  windMax: number | null;
  uvMax: number | null;
  sunrise: string | null;
  sunset: string | null;
};

type Summary = {
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  humidityLabel: string;
  precipitation: number;
  rainChance: number;
  rain24h: number;
  windSpeed: number | null;
  windGusts: number | null;
  windDirection: string;
  windLabel: string;
  weatherCode: number;
  dewPoint: number | null;
  uvIndex: number | null;
  uvLabel: string;
  high: number | null;
  low: number | null;
  sunrise: string | null;
  sunset: string | null;
  updatedAt: string | null;
};

type Alert = {
  level: 'critical' | 'moderate' | 'low' | 'info';
  type: string;
  title: string;
  date: string;
  message: string;
  issuedAgo: string;
  affectedTownships: string[];
};

type Tip = { kind: 'good' | 'warning' | 'tip'; text: string };

type WeatherBundle = {
  township: {
    name: string;
    nameEn: string;
    nameMy?: string;
    region: string;
    lat: number;
    lng: number;
  };
  summary: Summary;
  daily: DayForecast[];
  history: {
    points: Array<{ date: string; high: number | null; low: number | null; rain: number }>;
    rainTotal: number;
    avgTemp: number | null;
  };
  recommendations: { rice: Tip[]; onion: Tip[] };
  alerts: Alert[];
  cached?: boolean;
  offline?: boolean;
};

type MapTownship = Township & {
  summary?: Summary | null;
  loading?: boolean;
};

const RECENT_KEY = 'smart_agro_recent_townships';
const DEFAULT_TOWNS = ['Yangon', 'Mandalay', 'Bago', 'Naypyidaw'];

const copy = {
  en: {
    title: 'Weather Intelligence & Forecasting',
    location: 'Location',
    switchLang: 'Language',
    current: 'Current',
    humidity: 'Humidity',
    rain: 'Rain chance',
    wind: 'Wind',
    forecast: '7-Day Weather Forecast',
    metrics: 'Detailed Weather Metrics',
    map: 'Township Weather Map',
    alerts: 'Weather Alerts',
    history: 'Weather History & Trends',
    historyLead: 'Daily average temperatures for the recent period at this township.',
    recent: 'Recently viewed',
    clickMap: 'Click a township for detailed weather',
    rainfall: 'Rainfall (7 days)',
    avgTemp: 'Average temp',
    search: 'Search any place in Myanmar…',
    loading: 'Loading weather…',
    feels: 'Feels like',
    high: 'High',
    low: 'Low',
    dew: 'Dew point',
    cropsOk: 'Good for crops',
    precip: 'Precipitation',
    last24: 'Last 24h',
    gusts: 'Gusts',
    uv: 'UV Index',
    protect: 'Protection recommended',
    sunMoon: 'Sun & Moon',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    temperature: 'Temperature',
    list: 'List',
    close: 'Close',
    cached: 'cached',
    offline: 'seasonal estimate (live weather blocked)',
    mmToday: 'mm today',
    uvTip: 'Limit midday exposure when UV is high.',
    timezone: 'Timezone: Asia/Yangon',
    legendSunny: 'Sunny',
    legendPartly: 'Partly',
    legendRain: 'Rain',
    legendStorm: 'Storm',
    noTownships: 'No townships yet. Run server seed.',
    loadFailed: 'Failed to load weather',
    useMyLocation: 'Use my location',
    nationwide: 'nationwide',
    saved: 'saved',
    myanmar: 'Myanmar',
  },
  my: {
    title: 'ရာသီဥတု ထောက်လှမ်းမှုနှင့် ခန့်မှန်းချက်',
    location: 'တည်နေရာ',
    switchLang: 'ဘာသာစကား',
    current: 'လက်ရှိ',
    humidity: 'စိုထိုင်းဆ',
    rain: 'မိုးရွာနိုင်ခြေ',
    wind: 'လေ',
    forecast: '၇ ရက် ခန့်မှန်းချက်',
    metrics: 'အသေးစိတ် တိုင်းတာချက်များ',
    map: 'မြို့နယ် ရာသီဥတု မြေပုံ',
    alerts: 'ရာသီဥတု သတိပေးချက်',
    history: 'ရာသီဥတု မှတ်တမ်း',
    historyLead: 'ဤမြို့နယ်၏ မကြာသေးမီ ပျမ်းမျှ အပူချိန်များ။',
    recent: 'မကြာသေးမီ ကြည့်ရှုခဲ့သော',
    clickMap: 'အသေးစိတ်ကြည့်ရန် မြို့နယ်ကို နှိပ်ပါ',
    rainfall: 'မိုးရေချိန် (၇ ရက်)',
    avgTemp: 'ပျမ်းမျှ အပူချိန်',
    search: 'မြန်မာတနိုင်ငံလုံး ရှာရန်…',
    loading: 'ရာသီဥတု တင်နေသည်…',
    feels: 'ခံစားရမှု',
    high: 'အမြင့်ဆုံး',
    low: 'အနိမ့်ဆုံး',
    dew: 'နှင်းစက်',
    cropsOk: 'သီးနှံအတွက် ကောင်း',
    precip: 'မိုးရေ',
    last24: 'လွန်ခဲ့သော ၂၄ နာရီ',
    gusts: 'လေပြင်း',
    uv: 'UV အဆင့်',
    protect: 'ကာကွယ်ရန် အကြံပြု',
    sunMoon: 'နေနှင့် လ',
    sunrise: 'နေထွက်',
    sunset: 'နေဝင်',
    temperature: 'အပူချိန်',
    list: 'စာရင်း',
    close: 'ပိတ်ရန်',
    cached: 'သိမ်းထား',
    offline: 'ရာသီခန့်မှန်း (တိုက်ရိုက် ရာသီဥတု မရ)',
    mmToday: 'မီလီမီတာ ယနေ့',
    uvTip: 'UV မြင့်ချိန်တွင် မွန်းတည့်အချိန် ထိတွေ့မှုကို လျှော့ပါ။',
    timezone: 'စံတော်ချိန်: အာရှ/ရန်ကုန်',
    legendSunny: 'နေသာ',
    legendPartly: 'တိမ်အနည်းငယ်',
    legendRain: 'မိုး',
    legendStorm: 'မုန်တိုင်း',
    noTownships: 'မြို့နယ် မရှိသေးပါ။ ဆာဗာဒေတာ ထည့်သွင်းပါ။',
    loadFailed: 'ရာသီဥတု တင်မရပါ',
    useMyLocation: 'ကျွန်ုပ်၏ တည်နေရာ',
    nationwide: 'တစ်နိုင်ငံလုံး',
    saved: 'သိမ်းထား',
    myanmar: 'မြန်မာ',
  },
};

function SoftIcon({ tone, children, className = '' }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`wx-ico ${tone} ${className}`}>{children}</span>;
}

function weatherMeta(code: number, lang: Lang = 'en') {
  const labels =
    lang === 'my'
      ? {
          clear: 'ကြည်လင်',
          partlyCloudy: 'တစ်စိတ်တစ်ပိုင်း တိမ်ထူ',
          cloudy: 'တိမ်ထူ',
          fog: 'မြူဆိုင်း',
          drizzle: 'မိုးဖွဲ',
          rain: 'မိုးရွာ',
          snow: 'နှင်း',
          showers: 'မိုးရွာပြင်း',
          thunderstorm: 'မိုးကြိုးမုန်တိုင်း',
          fair: 'ကောင်းမွန်',
        }
      : {
          clear: 'Clear',
          partlyCloudy: 'Partly cloudy',
          cloudy: 'Cloudy',
          fog: 'Fog',
          drizzle: 'Drizzle',
          rain: 'Rain',
          snow: 'Snow',
          showers: 'Showers',
          thunderstorm: 'Thunderstorm',
          fair: 'Fair',
        };

  if (code === 0) return { label: labels.clear, tone: 'amber' as Tone, Icon: IconSun };
  if (code <= 2) return { label: labels.partlyCloudy, tone: 'sky' as Tone, Icon: IconPartly };
  if (code === 3) return { label: labels.cloudy, tone: 'teal' as Tone, Icon: IconCloud };
  if (code === 45 || code === 48) return { label: labels.fog, tone: 'teal' as Tone, Icon: IconFog };
  if (code >= 51 && code <= 57) return { label: labels.drizzle, tone: 'sky' as Tone, Icon: IconDrizzle };
  if (code >= 61 && code <= 67) return { label: labels.rain, tone: 'sky' as Tone, Icon: IconRain };
  if (code >= 71 && code <= 77) return { label: labels.snow, tone: 'sky' as Tone, Icon: IconSnow };
  if (code >= 80 && code <= 82) return { label: labels.showers, tone: 'sky' as Tone, Icon: IconDrizzle };
  if (code >= 95) return { label: labels.thunderstorm, tone: 'coral' as Tone, Icon: IconStorm };
  return { label: labels.fair, tone: 'mint' as Tone, Icon: IconPartly };
}

function fmtTemp(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n)}°`;
}

function fmtC(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n * 10) / 10}°C`;
}

function toF(c: number | null | undefined) {
  if (c == null) return '—';
  return `${Math.round((c * 9) / 5 + 32)}°F`;
}

function fmtTime(iso: string | null | undefined, lang: Lang = 'en') {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString(lang === 'my' ? 'my-MM' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(11, 16);
  }
}

function dayLabel(date: string, index: number, lang: Lang) {
  if (index === 0) return lang === 'en' ? 'Today' : 'ယနေ့';
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(lang === 'my' ? 'my-MM' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
  });
}

function mapTileLimit() {
  if (typeof window === 'undefined') return 16;
  if (window.matchMedia('(max-width: 640px)').matches) return 6;
  if (window.matchMedia('(max-width: 900px)').matches) return 10;
  return 16;
}

function loadRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : DEFAULT_TOWNS;
  } catch {
    return DEFAULT_TOWNS;
  }
}

function saveRecent(name: string) {
  const next = [name, ...loadRecent().filter((n) => n.toLowerCase() !== name.toLowerCase())].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export function WeatherPage() {
  const { lang, setLang } = useLanguage();
  const t = copy[lang];
  const [township, setTownship] = useState(() => readPreferredTownship()?.nameEn || 'Yangon');
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allTownships, setAllTownships] = useState<Township[]>([]);
  const [searchResults, setSearchResults] = useState<Township[]>([]);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const [bundle, setBundle] = useState<WeatherBundle | null>(null);
  const [mapTowns, setMapTowns] = useState<MapTownship[]>([]);
  const [mapCatalog, setMapCatalog] = useState<Township[]>([]);
  const [mapLimit, setMapLimit] = useState(() => mapTileLimit());
  const [selectedDay, setSelectedDay] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<number | null>(null);

  async function fetchTownships(search?: string) {
    return api<Township[]>(
      `/weather/townships${search ? `?search=${encodeURIComponent(search)}` : ''}`
    );
  }

  async function loadAllTownships() {
    const list = (await fetchTownships()) || [];
    setAllTownships(list);
    setSearchResults(list);
    return list;
  }

  function placeCoords(tw: Township): { lat: number; lng: number } | null {
    if (typeof tw.lat === 'number' && typeof tw.lng === 'number') {
      return { lat: tw.lat, lng: tw.lng };
    }
    const c = tw.coordinates?.coordinates;
    if (c && c.length >= 2) return { lat: c[1], lng: c[0] };
    return null;
  }

  async function selectTownship(tw: Township | string) {
    setPickerOpen(false);
    setQuery('');
    if (typeof tw === 'string') {
      await loadWeatherByName(tw.trim());
      return;
    }
    const coords = placeCoords(tw);
    if (coords) {
      await loadWeatherByPlace(coords.lat, coords.lng, tw.nameEn || tw.name, tw.region);
      return;
    }
    await loadWeatherByName(tw.nameEn || tw.name);
  }

  async function loadWeatherByPlace(lat: number, lng: number, name: string, region?: string) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        name,
      });
      if (region) params.set('region', region);
      const data = await api<WeatherBundle>(`/weather/place?${params.toString()}`);
      setBundle(data);
      setTownship(data.township.nameEn || data.township.name);
      setSelectedDay(0);
      setRecent(saveRecent(data.township.nameEn || data.township.name));
      writePreferredTownship({
        nameEn: data.township.nameEn || data.township.name,
        nameMy: data.township.nameMy,
        region: data.township.region,
        lat: data.township.lat,
        lng: data.township.lng,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeatherByName(name: string) {
    if (!name) return;
    setLoading(true);
    setError('');
    try {
      const data = await api<WeatherBundle>(`/weather/township/${encodeURIComponent(name)}`);
      setBundle(data);
      setTownship(data.township.nameEn || data.township.name);
      setSelectedDay(0);
      setRecent(saveRecent(data.township.nameEn || data.township.name));
      writePreferredTownship({
        nameEn: data.township.nameEn || data.township.name,
        nameMy: data.township.nameMy,
        region: data.township.region,
        lat: data.township.lat,
        lng: data.township.lng,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function loadMapSnapshots(list: Township[], limit = mapTileLimit()) {
    setMapCatalog(list);
    const targets = list.slice(0, limit);
    setMapTowns(targets.map((x) => ({ ...x, loading: true })));
    const rows = await Promise.all(
      targets.map(async (tw) => {
        try {
          const coords = placeCoords(tw);
          const data = coords
            ? await api<WeatherBundle>(
                `/weather/place?lat=${coords.lat}&lng=${coords.lng}&name=${encodeURIComponent(tw.nameEn || tw.name)}&region=${encodeURIComponent(tw.region || '')}`
              )
            : await api<WeatherBundle>(`/weather/township/${encodeURIComponent(tw.nameEn || tw.name)}`);
          return { ...tw, summary: data.summary, loading: false };
        } catch {
          return { ...tw, summary: null, loading: false };
        }
      })
    );
    setMapTowns(rows);
  }

  useEffect(() => {
    const syncLimit = () => {
      const next = mapTileLimit();
      setMapLimit((prev) => {
        if (prev === next) return prev;
        return next;
      });
    };
    syncLimit();
    window.addEventListener('resize', syncLimit);
    return () => window.removeEventListener('resize', syncLimit);
  }, []);

  useEffect(() => {
    if (!mapCatalog.length) return;
    if (mapTowns.length > mapLimit) {
      setMapTowns((prev) => prev.slice(0, mapLimit));
      return;
    }
    if (mapTowns.length < mapLimit) {
      void loadMapSnapshots(mapCatalog, mapLimit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resize-driven remap only
  }, [mapLimit]);

  useEffect(() => {
    void (async () => {
      const list = await loadAllTownships().catch(() => [] as Township[]);
      const saved = readPreferredTownship();
      if (saved?.nameEn) {
        await loadWeatherByName(saved.nameEn);
      } else {
        await loadWeatherByName('Yangon');
      }
      if (list.length) void loadMapSnapshots(list, mapTileLimit());
    })();
  }, []);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError(lang === 'en' ? 'Geolocation is not supported.' : 'တည်နေရာ မပံ့ပိုးပါ။');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30_000,
        });
      });
      await loadWeatherByPlace(pos.coords.latitude, pos.coords.longitude, 'My location', 'Myanmar');
    } catch {
      setError(
        lang === 'en'
          ? 'Location permission denied. Choose a township instead.'
          : 'တည်နေရာ ခွင့်ပြုချက် မရပါ။ မြို့နယ် ရွေးပါ။'
      );
      setLoading(false);
    }
  }

  // Debounced remote search while typing in the picker (does not shrink the select list)
  useEffect(() => {
    if (!pickerOpen) return;
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      const q = query.trim();
      if (!q) {
        setSearchResults(allTownships);
        return;
      }
      void fetchTownships(q)
        .then((list) => setSearchResults(list || []))
        .catch(() => {
          const lower = q.toLowerCase();
          setSearchResults(
            allTownships.filter(
              (tw) =>
                tw.nameEn?.toLowerCase().includes(lower) ||
                tw.name?.toLowerCase().includes(lower) ||
                tw.nameMy?.includes(q) ||
                tw.region?.toLowerCase().includes(lower)
            )
          );
        });
    }, 220);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query, pickerOpen, allTownships]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const condition = useMemo(
    () => weatherMeta(bundle?.summary.weatherCode ?? 0, lang),
    [bundle?.summary.weatherCode, lang]
  );

  const selected = bundle?.daily?.[selectedDay];

  const chart = useMemo(() => {
    const tones = ['teal', 'ink', 'stone'] as const;
    const points = bundle?.history?.points || [];
    const highs = points.map((p) => p.high).filter((n): n is number => n != null);
    const lows = points.map((p) => p.low).filter((n): n is number => n != null);
    const max = Math.max(35, ...highs, 1);
    const min = Math.min(0, ...lows, 0);
    const span = Math.max(1, max - min);
    const bars = points.map((p, i) => {
      const avg =
        p.high != null && p.low != null ? (p.high + p.low) / 2 : p.high ?? p.low ?? min;
      const value = Math.max(min, Math.min(max, avg));
      const pct = Math.max(8, Math.round(((value - min) / span) * 100));
      return {
        date: p.date,
        label: p.date.slice(8),
        avg: value,
        pct,
        tone: tones[i % tones.length],
        accent: i % 3 === 1,
      };
    });
    return { bars, min, max };
  }, [bundle?.history?.points]);

  const filteredTowns = searchResults;

  const currentName = bundle?.township.nameEn || township;

  // Keep select options complete even if current township was loaded before list arrived
  const selectOptions = useMemo(() => {
    if (!currentName) return allTownships;
    const exists = allTownships.some(
      (tw) => (tw.nameEn || tw.name).toLowerCase() === currentName.toLowerCase()
    );
    if (exists) return allTownships;
    return [
      {
        name: currentName,
        nameEn: currentName,
        nameMy: bundle?.township.nameMy,
        region: bundle?.township.region || 'Myanmar',
      },
      ...allTownships,
    ];
  }, [allTownships, currentName, bundle?.township.nameMy, bundle?.township.region]);

  return (
    <div className="wx-page">
      {/* Header / current */}
      <section className="wx-panel wx-hero">
        <header className="wx-section-head">
          <div>
            <SoftIcon tone="sky">
              <IconPartly />
            </SoftIcon>
            <h1>{t.title}</h1>
          </div>
          <div className="wx-lang">
            <span>{t.switchLang}</span>
            <button type="button" className={lang === 'my' ? 'is-active' : ''} onClick={() => setLang('my')}>
              Myanmar
            </button>
            <button type="button" className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>
              English
            </button>
          </div>
        </header>

        <div className="wx-location-row">
          <div className="wx-location">
            <SoftIcon tone="coral">
              <IconPin />
            </SoftIcon>
            <div>
              <strong>
                {formatTownshipLabel(
                  bundle?.township.nameEn || currentName,
                  bundle?.township.nameMy,
                  lang
                )}
              </strong>
              <span>
                {t.location}: {formatRegionLabel(bundle?.township.region || t.myanmar, lang)}
                {loading ? ` · ${t.loading}` : bundle?.offline ? ` · ${t.offline}` : bundle?.cached ? ` · ${t.cached}` : ''}
              </span>
            </div>
          </div>

          <div className="wx-township-picker" ref={pickerRef}>
            <label className="wx-select-wrap">
              <span>{lang === 'en' ? 'Township' : 'မြို့နယ်'}</span>
              <select
                value={currentName}
                disabled={loading || selectOptions.length === 0}
                aria-label={lang === 'en' ? 'Select township' : 'မြို့နယ် ရွေးရန်'}
                onChange={(e) => {
                  const value = e.target.value;
                  const match = selectOptions.find((tw) => (tw.nameEn || tw.name) === value);
                  if (match) void selectTownship(match);
                  else if (value) void selectTownship(value);
                }}
              >
                {selectOptions.map((tw) => {
                  const value = tw.nameEn || tw.name;
                  const label =
                    lang === 'my' && tw.nameMy
                      ? `${tw.nameMy} (${value})`
                      : `${value} — ${tw.region}`;
                  return (
                    <option key={`${value}-${tw.region}`} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>

            <div className={`wx-search ${pickerOpen ? 'is-open' : ''}`}>
              <SoftIcon tone="teal">
                <IconSearch />
              </SoftIcon>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPickerOpen(true);
                }}
                onFocus={() => setPickerOpen(true)}
                placeholder={t.search}
                aria-expanded={pickerOpen}
                aria-controls="wx-township-results"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setPickerOpen(false);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const first = filteredTowns[0];
                    if (first) void selectTownship(first);
                    else if (query.trim()) void selectTownship(query.trim());
                  }
                }}
              />
              <button
                type="button"
                className="button compact"
                disabled={loading}
                onClick={() => setPickerOpen((v) => !v)}
              >
                {pickerOpen ? t.close : t.list}
              </button>
            </div>

            <button
              type="button"
              className="button secondary compact"
              disabled={loading}
              onClick={() => void useMyLocation()}
            >
              {t.useMyLocation}
            </button>

            {pickerOpen && (
              <ul id="wx-township-results" className="wx-township-menu" role="listbox">
                {filteredTowns.length === 0 && (
                  <li className="wx-township-empty">
                    {lang === 'en'
                      ? 'No place found in Myanmar. Try another spelling.'
                      : 'မြန်မာနိုင်ငံတွင် မတွေ့ပါ။ စာလုံးပေါင်းပြန်စစ်ပါ။'}
                  </li>
                )}
                {filteredTowns.map((tw) => {
                  const value = tw.nameEn || tw.name;
                  const active = value.toLowerCase() === currentName.toLowerCase();
                  const key = `${value}-${tw.region}-${tw.lat ?? ''}-${tw.lng ?? ''}`;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={active ? 'is-active' : undefined}
                        onClick={() => void selectTownship(tw)}
                      >
                        <SoftIcon tone={active ? 'mint' : tw.source === 'geocode' ? 'teal' : 'sky'} className="sm">
                          <IconPin />
                        </SoftIcon>
                        <span>
                          <strong>
                            {formatTownshipLabel(value, tw.nameMy, lang)}
                          </strong>
                          <small>
                            {formatRegionLabel(tw.region || t.myanmar, lang)}
                            {tw.source === 'geocode' ? ` · ${t.nationwide}` : ` · ${t.saved}`}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {error && <div className="auth-banner error">{error}</div>}
        {loading && !bundle && <p className="muted">{t.loading}</p>}

        {bundle && (
          <div className="wx-metric-row">
            <article className="wx-metric amber">
              <SoftIcon tone="amber">
                <condition.Icon />
              </SoftIcon>
              <strong>{fmtTemp(bundle.summary.temperature)}C</strong>
              <span>{t.current}</span>
              <small>
                {condition.label}
              </small>
            </article>
            <article className="wx-metric sky">
              <SoftIcon tone="sky">
                <IconDrop />
              </SoftIcon>
              <strong>{bundle.summary.humidity ?? '—'}%</strong>
              <span>{t.humidity}</span>
              <small>{bundle.summary.humidityLabel}</small>
            </article>
            <article className="wx-metric teal">
              <SoftIcon tone="teal">
                <IconRain />
              </SoftIcon>
              <strong>{Math.round(bundle.summary.rainChance)}%</strong>
              <span>{t.rain}</span>
              <small>
                {bundle.summary.rain24h.toFixed(1)} {t.mmToday}
              </small>
            </article>
            <article className="wx-metric mint">
              <SoftIcon tone="mint">
                <IconWind />
              </SoftIcon>
              <strong>
                {bundle.summary.windSpeed != null ? `${Math.round(bundle.summary.windSpeed)} km/h` : '—'}
              </strong>
              <span>{t.wind}</span>
              <small>
                {bundle.summary.windLabel} · {bundle.summary.windDirection}
              </small>
            </article>
          </div>
        )}
      </section>

      {/* 7-day forecast */}
      {bundle && (
        <section className="wx-panel">
          <header className="wx-section-head">
            <div>
              <SoftIcon tone="peach">
                <IconCalendar />
              </SoftIcon>
              <h2>{t.forecast}</h2>
            </div>
          </header>
          <div className="wx-forecast-grid">
            {bundle.daily.map((day, i) => {
              const meta = weatherMeta(day.weatherCode, lang);
              return (
                <button
                  key={day.date}
                  type="button"
                  className={`wx-day ${selectedDay === i ? 'is-active' : ''}`}
                  onClick={() => setSelectedDay(i)}
                >
                  <strong>{dayLabel(day.date, i, lang)}</strong>
                  <SoftIcon tone={meta.tone}>
                    <meta.Icon />
                  </SoftIcon>
                  <em>
                    {fmtTemp(day.high)} <span>{fmtTemp(day.low)}</span>
                  </em>
                  <small>{meta.label}</small>
                  <span className="wx-rain-chip">
                    <IconRain /> {Math.round(day.rainChance)}%
                  </span>
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="wx-day-detail">
              <SoftIcon tone={weatherMeta(selected.weatherCode, lang).tone}>
                {(() => {
                  const I = weatherMeta(selected.weatherCode, lang).Icon;
                  return <I />;
                })()}
              </SoftIcon>
              <div>
                <strong>
                  {dayLabel(selected.date, selectedDay, lang)} · {weatherMeta(selected.weatherCode, lang).label}
                </strong>
                <p>
                  {t.high} {fmtC(selected.high)} · {t.low} {fmtC(selected.low)} · {t.rain}{' '}
                  {Math.round(selected.rainChance)}% ({selected.rainSum.toFixed(1)} mm) · UV{' '}
                  {selected.uvMax ?? '—'}
                </p>
                <p className="muted">
                  {t.sunrise} {fmtTime(selected.sunrise, lang)} · {t.sunset} {fmtTime(selected.sunset, lang)}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Detailed metrics */}
      {bundle && (
        <section className="wx-panel">
          <header className="wx-section-head">
            <div>
              <SoftIcon tone="coral">
                <IconThermo />
              </SoftIcon>
              <h2>{t.metrics}</h2>
            </div>
          </header>
          <div className="wx-detail-grid">
            <article>
              <h3>
                <SoftIcon tone="coral">
                  <IconThermo />
                </SoftIcon>
                {t.temperature}
              </h3>
              <strong>
                {fmtC(bundle.summary.temperature)} ({toF(bundle.summary.temperature)})
              </strong>
              <p>
                {t.feels}: {fmtC(bundle.summary.feelsLike)}
              </p>
              <p>
                {t.high}: {fmtC(bundle.summary.high)} · {t.low}: {fmtC(bundle.summary.low)}
              </p>
            </article>
            <article>
              <h3>
                <SoftIcon tone="sky">
                  <IconDrop />
                </SoftIcon>
                {t.humidity}
              </h3>
              <strong>{bundle.summary.humidity ?? '—'}%</strong>
              <p>
                {t.dew}: {fmtC(bundle.summary.dewPoint)}
              </p>
              <p>
                {bundle.summary.humidityLabel} · {t.cropsOk}
              </p>
            </article>
            <article>
              <h3>
                <SoftIcon tone="teal">
                  <IconRain />
                </SoftIcon>
                {t.precip}
              </h3>
              <strong>{(bundle.summary.precipitation ?? 0).toFixed(1)} mm</strong>
              <p>
                {t.rain}: {Math.round(bundle.summary.rainChance)}%
              </p>
              <p>
                {t.last24}: {bundle.summary.rain24h.toFixed(1)} mm
              </p>
            </article>
            <article>
              <h3>
                <SoftIcon tone="mint">
                  <IconWind />
                </SoftIcon>
                {t.wind}
              </h3>
              <strong>
                {bundle.summary.windSpeed != null ? `${Math.round(bundle.summary.windSpeed)} km/h` : '—'}
              </strong>
              <p>
                {bundle.summary.windDirection} · {bundle.summary.windLabel}
              </p>
              <p>
                {t.gusts}:{' '}
                {bundle.summary.windGusts != null ? `${Math.round(bundle.summary.windGusts)} km/h` : '—'}
              </p>
            </article>
            <article>
              <h3>
                <SoftIcon tone="amber">
                  <IconSun />
                </SoftIcon>
                {t.uv}
              </h3>
              <strong>
                {bundle.summary.uvIndex ?? '—'} ({bundle.summary.uvLabel})
              </strong>
              <p>{t.protect}</p>
              <p className="muted">{t.uvTip}</p>
            </article>
            <article>
              <h3>
                <SoftIcon tone="peach">
                  <IconSun />
                </SoftIcon>
                {t.sunMoon}
              </h3>
              <strong>
                {t.sunrise}: {fmtTime(bundle.summary.sunrise, lang)}
              </strong>
              <p>
                {t.sunset}: {fmtTime(bundle.summary.sunset, lang)}
              </p>
              <p className="muted">{t.timezone}</p>
            </article>
          </div>
        </section>
      )}

      {/* Township weather map */}
      <section className="wx-panel">
        <header className="wx-section-head">
          <div>
            <SoftIcon tone="mint">
              <IconMap />
            </SoftIcon>
            <h2>{t.map}</h2>
          </div>
        </header>
        <p className="muted wx-map-hint">{t.clickMap}</p>
        <div className="wx-map-grid">
          {mapTowns.map((tw) => {
            const meta = weatherMeta(tw.summary?.weatherCode ?? 1, lang);
            const active =
              (bundle?.township.nameEn || township).toLowerCase() ===
              (tw.nameEn || tw.name).toLowerCase();
            return (
              <button
                key={`${tw.nameEn}-${tw.region}`}
                type="button"
                className={`wx-map-tile ${active ? 'is-active' : ''}`}
                onClick={() => void selectTownship(tw)}
              >
                <SoftIcon tone={meta.tone}>
                  <meta.Icon />
                </SoftIcon>
                <strong>{lang === 'my' && tw.nameMy ? tw.nameMy : tw.nameEn || tw.name}</strong>
                <span>{formatRegionLabel(tw.region, lang)}</span>
                <em>
                  {tw.loading ? '…' : fmtTemp(tw.summary?.temperature ?? null)}
                  {!tw.loading && tw.summary ? 'C' : ''}
                </em>
                <small>{tw.loading ? '…' : meta.label}</small>
              </button>
            );
          })}
          {mapTowns.length === 0 && (
            <p className="muted">{t.noTownships}</p>
          )}
        </div>
        <div className="wx-legend">
          <span>
            <SoftIcon tone="amber" className="sm">
              <IconSun />
            </SoftIcon>{' '}
            {t.legendSunny}
          </span>
          <span>
            <SoftIcon tone="sky" className="sm">
              <IconPartly />
            </SoftIcon>{' '}
            {t.legendPartly}
          </span>
          <span>
            <SoftIcon tone="teal" className="sm">
              <IconRain />
            </SoftIcon>{' '}
            {t.legendRain}
          </span>
          <span>
            <SoftIcon tone="coral" className="sm">
              <IconStorm />
            </SoftIcon>{' '}
            {t.legendStorm}
          </span>
        </div>
        <div className="wx-recent">
          <span>{t.recent}:</span>
          {recent.map((name) => (
            <button key={name} type="button" onClick={() => void selectTownship(name)}>
              {name}
            </button>
          ))}
        </div>
      </section>

      {/* Alerts */}
      {bundle && (
        <section className="wx-panel">
          <header className="wx-section-head">
            <div>
              <SoftIcon tone="amber">
                <IconAlert />
              </SoftIcon>
              <h2>{t.alerts}</h2>
            </div>
          </header>
          <div className="wx-alerts">
            {bundle.alerts.map((a, i) => (
              <article key={`${a.type}-${a.date}-${i}`} className={`wx-alert ${a.level}`}>
                <header>
                  <SoftIcon tone={a.level === 'critical' || a.level === 'moderate' ? 'amber' : a.level === 'low' ? 'mint' : 'sky'}>
                    <IconAlert />
                  </SoftIcon>
                  <div>
                    <strong>{a.title}</strong>
                    <span>{a.issuedAgo}</span>
                  </div>
                </header>
                <p>{a.message}</p>
                <footer>
                  <SoftIcon tone="coral" className="sm">
                    <IconPin />
                  </SoftIcon>
                  {a.affectedTownships.join(', ')}
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {bundle && (
        <section className="wx-panel wx-history-panel">
          <div className="wx-column-chart" role="img" aria-label={t.history}>
            <aside className="wx-column-side">
              <h2 className="wx-column-heading">{t.history}</h2>
              <p className="wx-column-lead">{t.historyLead}</p>
              <ul className="wx-column-legend">
                <li>
                  <span className="wx-column-legend-ico teal">
                    <IconRain />
                  </span>
                  <div>
                    <strong>{t.rainfall}</strong>
                    <span>{bundle.history.rainTotal} mm</span>
                  </div>
                </li>
                <li>
                  <span className="wx-column-legend-ico ink">
                    <IconThermo />
                  </span>
                  <div>
                    <strong>{t.avgTemp}</strong>
                    <span>
                      {bundle.history.avgTemp != null ? `${bundle.history.avgTemp}°C` : '—'}
                    </span>
                  </div>
                </li>
                <li>
                  <span className="wx-column-legend-ico stone">
                    <IconChart />
                  </span>
                  <div>
                    <strong>{t.temperature}</strong>
                    <span>
                      {chart.min.toFixed(0)}–{chart.max.toFixed(0)}°C
                    </span>
                  </div>
                </li>
              </ul>
            </aside>

            <div className="wx-column-plot">
              <div className="wx-column-bars">
                {chart.bars.map((bar) => (
                  <div key={bar.date} className="wx-col" title={`${bar.date}: ${bar.avg.toFixed(1)}°C`}>
                    <div className="wx-col-track">
                      <div
                        className={`wx-col-fill tone-${bar.tone}`}
                        style={{ height: `${bar.pct}%` }}
                      >
                        <span>{Math.round(bar.avg)}°</span>
                      </div>
                    </div>
                    <span className={`wx-col-dot ${bar.accent ? 'accent' : ''}`} />
                    <span className="wx-col-label">{bar.label}</span>
                  </div>
                ))}
              </div>
              <div className="wx-column-axis" aria-hidden />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ——— icons ——— */
function svg(size = 18) {
  return { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', 'aria-hidden': true as const };
}

function IconSun() {
  return (
    <svg {...svg()}>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconPartly() {
  return (
    <svg {...svg()}>
      <circle cx="9" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 17h8.2a3 3 0 0 0 .2-6 4.2 4.2 0 0 0-8-.8A2.9 2.9 0 0 0 8 17z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconCloud() {
  return (
    <svg {...svg()}>
      <path d="M7.5 17.5h9.2a3.3 3.3 0 0 0 .3-6.6 4.5 4.5 0 0 0-8.7-1.2A3.2 3.2 0 0 0 7.5 17.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function IconRain() {
  return (
    <svg {...svg()}>
      <path d="M7.5 14.5h9.2a3.3 3.3 0 0 0 .3-6.6 4.5 4.5 0 0 0-8.7-1.2A3.2 3.2 0 0 0 7.5 14.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 17.5v2M12 17v3M15 17.5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconDrizzle() {
  return (
    <svg {...svg()}>
      <path d="M7.5 14h9.2a3.3 3.3 0 0 0 .3-6.6 4.5 4.5 0 0 0-8.7-1.2A3.2 3.2 0 0 0 7.5 14z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 16.5v1.5M13 16v2M16 16.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconStorm() {
  return (
    <svg {...svg()}>
      <path d="M7.5 13.5h9.2a3.3 3.3 0 0 0 .3-6.6 4.5 4.5 0 0 0-8.7-1.2A3.2 3.2 0 0 0 7.5 13.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 14l-2 4h3l-1.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconFog() {
  return (
    <svg {...svg()}>
      <path d="M5 10h14M6 13.5h12M7 17h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconSnow() {
  return (
    <svg {...svg()}>
      <path d="M12 5v14M7 8.5l10 7M17 8.5l-10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconDrop() {
  return (
    <svg {...svg()}>
      <path d="M12 4.5c0 0 5.5 6 5.5 9.5a5.5 5.5 0 1 1-11 0C6.5 10.5 12 4.5 12 4.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconWind() {
  return (
    <svg {...svg()}>
      <path d="M4 10h11a2.5 2.5 0 1 0-1.8-4.2M4 14h13a2.5 2.5 0 1 1-1.8 4.2M4 18h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg {...svg()}>
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="11" r="2.1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg {...svg()}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg {...svg()}>
      <rect x="4" y="6" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4v4M16 4v4M4 11h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconThermo() {
  return (
    <svg {...svg()}>
      <path d="M10 14.5V6.5a2 2 0 1 1 4 0v8a3.2 3.2 0 1 1-4 0z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg {...svg()}>
      <path d="M4 7.5 9.5 5l5 2.5L20 5v13.5L14.5 21l-5-2.5L4 21V7.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg {...svg()}>
      <path d="M12 4.5 21 19H3L12 4.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4M12 16.5h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg {...svg()}>
      <path d="M5 19V5M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 15l3.5-4 3 2.5L18 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

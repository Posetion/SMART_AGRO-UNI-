import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HEAT_GRADIENT,
  MyanmarHeatMap,
  riskColor,
  type RiskKey,
} from '../components/MyanmarHeatMap';
import { IconMap, IconPin, IconWeather } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import { buildDemoHeatmap, DEMO_TOWNSHIPS } from '../data/demoHeatmap';
import { MYANMAR_REGION_META, normalizeRegionKey } from '../data/myanmarStatesGeo';
import { heatmapCopy } from '../i18n/messages';
import { formatDiseaseLabel } from '../data/diseaseNames';
import { formatRegionLabel } from '../utils/localizeFarm';
import { api } from '../services/api';

type CropFilter = 'all' | 'rice';
type RangeKey = 'today' | '24h' | '7d' | '30d';
type MapBase = 'streets' | 'satellite';
type MapMode = 'heat' | 'regions' | 'both';

type Feature = {
  properties: {
    name: string;
    region: string;
    outbreakCount: number;
    riskLevel: string;
  };
};

type AggregateRow = {
  _id: { township?: string; disease?: string };
  count: number;
};

type RecentRow = {
  township?: string;
  disease?: string;
  severity?: number;
  timestamp?: string;
};

type DetectionPoint = {
  lat: number;
  lng: number;
  township?: string;
  region?: string;
  disease?: string;
  severity?: number;
  timestamp?: string;
};

type HeatmapPayload = {
  features?: Feature[];
  aggregates?: AggregateRow[];
  recent?: RecentRow[];
  detections?: DetectionPoint[];
  totals?: {
    detections: number;
    townships: number;
    diseases: number;
    byDisease?: Array<{ disease: string; count: number }>;
  };
};

type WeatherBundle = {
  township?: { name?: string; nameEn?: string; region?: string };
  weather?: {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      weathercode?: number[];
    };
  };
};

const DISEASES = [
  'All',
  'Blast',
  'Brown Spot',
  'Bacterial Leaf Blight',
  'Sheath Blight',
  'Leaf Scald',
  'Leaf Smut',
  'Tungro',
  'False Smut',
  'Narrow Brown Spot',
  'Bacterial Leaf Streak',
  'Sheath Rot',
  'Bakanae',
  'Stem Rot',
  'Yellow Stem Borer',
  'Pink Stem Borer',
  'Brown Planthopper',
  'Whitebacked Planthopper',
  'Green Leafhopper',
  'Rice Leaf Folder',
  'Rice Caseworm',
  'Rice Gall Midge',
  'Rice Hispa',
  'Whorl Maggot',
  'Rice Armyworm',
  'Rice Bug',
  'Rice Thrips',
  'Healthy',
] as const;

const RICE_DISEASES = new Set([
  'Blast',
  'Rice Blast',
  'Leaf Blast',
  'Brown Spot',
  'Bacterial Leaf Blight',
  'Sheath Blight',
  'Leaf Scald',
  'Leaf Smut',
  'Tungro',
  'False Smut',
  'Narrow Brown Spot',
  'Bacterial Leaf Streak',
  'Sheath Rot',
  'Bakanae',
  'Stem Rot',
  'Yellow Stem Borer',
  'Pink Stem Borer',
  'Brown Planthopper',
  'Whitebacked Planthopper',
  'Green Leafhopper',
  'Rice Leaf Folder',
  'Rice Caseworm',
  'Rice Gall Midge',
  'Rice Hispa',
  'Whorl Maggot',
  'Rice Armyworm',
  'Rice Bug',
  'Rice Thrips',
  'Healthy',
]);

const TOWNSHIP_COORDS = DEMO_TOWNSHIPS;

function riskFromCount(count: number): RiskKey {
  if (count >= 20) return 'critical';
  if (count >= 10) return 'high';
  if (count >= 3) return 'medium';
  if (count > 0) return 'low';
  return 'none';
}

function yangonYmd(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yangon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function weatherLabel(code?: number, lang: 'en' | 'my' = 'en') {
  if (code == null) return '—';
  if (code === 0) return lang === 'my' ? 'နေသာ' : 'Sunny';
  if (code <= 2) return lang === 'my' ? 'တိမ်အနည်းငယ်' : 'Partly cloudy';
  if (code <= 3) return lang === 'my' ? 'တိမ်ထူ' : 'Cloudy';
  if (code >= 61) return lang === 'my' ? 'မိုးရွာ' : 'Rain';
  return lang === 'my' ? 'ကောင်း' : 'Fair';
}

function timeAgo(iso?: string, lang: 'en' | 'my' = 'en') {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return lang === 'my' ? 'ယခုလေး' : 'Just now';
  if (m < 60) return lang === 'my' ? `${m} မိနစ်အကြာ` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'my' ? `${h} နာရီအကြာ` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === 'my' ? `${d} ရက်အကြာ` : `${d}d ago`;
}

export function HeatmapPage() {
  const { lang } = useLanguage();
  const t = heatmapCopy(lang);

  const [features, setFeatures] = useState<Feature[]>([]);
  const [aggregates, setAggregates] = useState<AggregateRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [detections, setDetections] = useState<DetectionPoint[]>([]);
  const [totals, setTotals] = useState<HeatmapPayload['totals'] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [range, setRange] = useState<RangeKey>('7d');
  const [day, setDay] = useState(() => yangonYmd());
  const [disease, setDisease] = useState('All');
  const [crop, setCrop] = useState<CropFilter>('all');
  const [base, setBase] = useState<MapBase>('streets');
  const [mode, setMode] = useState<MapMode>('both');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locate, setLocate] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('Yangon, Myanmar');
  const [weather, setWeather] = useState<WeatherBundle | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      // Temporary demo week — swap back to POST /heatmap/filter when live reports exist.
      const data = buildDemoHeatmap({ range, day, disease });
      setFeatures(data.features);
      setAggregates(data.aggregates);
      setRecent(data.recent);
      setDetections(data.detections);
      setTotals(data.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, disease, day]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api<WeatherBundle>('/weather/township/Yangon');
        setWeather(data);
        const name = data.township?.nameEn || data.township?.name || 'Yangon';
        setLocationLabel(`${name}, Myanmar`);
      } catch {
        /* optional */
      }
    })();
  }, []);

  const points = useMemo(() => {
    const countByTown = new Map<string, number>();
    for (const f of features) {
      countByTown.set(f.properties.name, f.properties.outbreakCount || 0);
    }

    // Crop filter adjusts counts from disease aggregates when possible
    if (crop !== 'all') {
      const filtered = new Map<string, number>();
      for (const a of aggregates) {
        const d = a._id.disease || '';
        if (crop === 'rice' && !RICE_DISEASES.has(d)) continue;
        if (crop === 'rice' && !RICE_DISEASES.has(d)) continue;
        const tw = a._id.township || '';
        filtered.set(tw, (filtered.get(tw) || 0) + a.count);
      }
      for (const key of countByTown.keys()) {
        countByTown.set(key, filtered.get(key) || 0);
      }
      for (const [tw, c] of filtered) {
        if (!countByTown.has(tw)) countByTown.set(tw, c);
      }
    }

    return Object.entries(TOWNSHIP_COORDS).map(([name, c]) => {
      const count = countByTown.get(name) || 0;
      return {
        name,
        region: c.region,
        lat: c.lat,
        lng: c.lng,
        count,
        risk: riskFromCount(count),
      };
    });
  }, [features, aggregates, crop]);

  const regionStats = useMemo(() => {
    const map: Record<
      string,
      { id: string; name: string; nameMy: string; count: number; risk: RiskKey; diseases: Record<string, number> }
    > = {};

    for (const f of MYANMAR_REGION_META) {
      map[f.id] = {
        id: f.id,
        name: f.name,
        nameMy: f.nameMy,
        count: 0,
        risk: 'none',
        diseases: {},
      };
    }

    for (const p of points) {
      const id = normalizeRegionKey(p.region);
      if (!id || !map[id]) continue;
      map[id].count += p.count;
    }

    for (const a of aggregates) {
      const d = a._id.disease || 'Unknown';
      if (crop === 'rice' && !RICE_DISEASES.has(d)) continue;
      if (crop === 'rice' && !RICE_DISEASES.has(d)) continue;
      const tw = a._id.township || '';
      const region = TOWNSHIP_COORDS[tw]?.region;
      const id = normalizeRegionKey(region) || normalizeRegionKey(tw);
      if (!id || !map[id]) continue;
      map[id].diseases[d] = (map[id].diseases[d] || 0) + a.count;
    }

    for (const row of Object.values(map)) {
      row.risk = riskFromCount(row.count);
    }
    return map;
  }, [points, aggregates, crop]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = Object.values(regionStats).sort((a, b) => b.count - a.count);
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nameMy.includes(search.trim()) ||
        points.some(
          (p) =>
            normalizeRegionKey(p.region) === r.id && p.name.toLowerCase().includes(q)
        )
    );
  }, [regionStats, search, points]);

  const riskCounts = useMemo(() => {
    const counts: Record<RiskKey, number> = { critical: 0, high: 0, medium: 0, low: 0, none: 0 };
    for (const r of Object.values(regionStats)) counts[r.risk] += 1;
    return counts;
  }, [regionStats]);

  const filteredDetections = useMemo(() => {
    return detections.filter((d) => {
      const name = d.disease || '';
      if (crop === 'rice' && !RICE_DISEASES.has(name)) return false;
      if (crop === 'rice' && !RICE_DISEASES.has(name)) return false;
      return true;
    });
  }, [detections, crop]);

  const communityCount = useMemo(() => {
    if (crop === 'all') return totals?.detections ?? detections.length;
    return filteredDetections.length;
  }, [crop, totals, detections.length, filteredDetections.length]);

  const selected = selectedId ? regionStats[selectedId] : null;
  const current = weather?.weather?.current;
  const daily = weather?.weather?.daily;

  function riskLabel(risk: RiskKey) {
    if (risk === 'critical') return t.critical;
    if (risk === 'high') return t.high;
    if (risk === 'medium') return t.medium;
    if (risk === 'low') return t.low;
    return t.noData;
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setLocate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      try {
        const data = await api<WeatherBundle>(
          `/weather/place?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&name=My%20location`
        );
        setWeather(data);
        const name = data.township?.nameEn || data.township?.name || 'My location';
        setLocationLabel(`${name}, Myanmar`);
      } catch {
        setLocationLabel('My location');
      }
    });
  }

  return (
    <div className="hm2-page">
      <header className="hm2-top">
        <div>
          <p className="hm2-eyebrow">
            <IconMap /> {t.badge}
          </p>
          <h1>{t.title}</h1>
          <p>{t.lead}</p>
          <p className="hm2-demo-note">{t.demoNote}</p>
          <p className="hm2-community">
            {t.communitySummary
              .replace('{count}', String(communityCount))
              .replace('{townships}', String(totals?.townships ?? 0))
              .replace(
                '{window}',
                range === 'today' ? `${t.rangeToday} (${day})` : range === '24h' ? t.range24h : range === '7d' ? t.range7d : t.range30d
              )}
          </p>
        </div>
        <div className="hm2-top-actions">
          <label className="hm2-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>
          <button type="button" className="hm2-locate-btn" onClick={useMyLocation}>
            <IconPin /> {t.myLocation}
          </button>
        </div>
      </header>

      <div className="hm2-toolbar">
        <div className="hm2-seg">
          <button type="button" className={mode === 'both' ? 'is-active' : ''} onClick={() => setMode('both')}>
            {t.diseaseLayer}
          </button>
          <button type="button" className={mode === 'heat' ? 'is-active' : ''} onClick={() => setMode('heat')}>
            {t.heatOnly}
          </button>
          <button type="button" className={mode === 'regions' ? 'is-active' : ''} onClick={() => setMode('regions')}>
            {t.boundaries}
          </button>
        </div>

        <div className="hm2-filters">
          <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>
            <option value="today">{t.rangeToday}</option>
            <option value="24h">{t.range24h}</option>
            <option value="7d">{t.range7d}</option>
            <option value="30d">{t.range30d}</option>
          </select>
          {range === 'today' && (
            <input
              type="date"
              value={day}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDay(e.target.value)}
              aria-label={t.pickDay}
            />
          )}
          <select value={disease} onChange={(e) => setDisease(e.target.value)}>
            {DISEASES.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? t.allDiseases : formatDiseaseLabel(d, lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="hm2-seg">
          <button type="button" className={base === 'streets' ? 'is-active' : ''} onClick={() => setBase('streets')}>
            {t.political}
          </button>
          <button type="button" className={base === 'satellite' ? 'is-active' : ''} onClick={() => setBase('satellite')}>
            {t.satellite}
          </button>
        </div>
      </div>

      {error && <div className="auth-banner error">{error}</div>}

      <div className="hm2-layout">
        <section className="hm2-map-card">
          <div className="hm2-map-meta">
            <span>
              <IconPin /> {t.currentLocation}: <strong>{locationLabel}</strong>
            </span>
            {loading && <span className="muted">{t.loading}</span>}
          </div>

          <MyanmarHeatMap
            points={points}
            detections={filteredDetections}
            regionStats={regionStats}
            base={base}
            mode={mode}
            selectedId={selectedId}
            lang={lang}
            onSelectRegion={setSelectedId}
            locate={locate}
          />

          <div className="hm2-legend-bar" aria-label={t.intensityLegend}>
            <div className="hm2-legend-bar-head">
              <strong>{t.intensityLegend}</strong>
              <span>{t.cases}</span>
            </div>
            <div className="hm2-legend-bar-body">
              <div
                className="hm2-legend-gradient"
                style={{
                  background: `linear-gradient(to top, ${Object.entries(HEAT_GRADIENT)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([, c]) => c)
                    .join(', ')})`,
                }}
              />
              <ol className="hm2-legend-scale">
                <li>{t.legendHigh}</li>
                <li>20+</li>
                <li>10</li>
                <li>5</li>
                <li>1</li>
                <li>{t.legendLow}</li>
              </ol>
            </div>
            <div className="hm2-legend-risk-row">
              {(['low', 'medium', 'high', 'critical'] as RiskKey[]).map((k) => (
                <span key={k}>
                  <i style={{ background: riskColor(k) }} /> {riskLabel(k)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <aside className="hm2-side">
          <div className="hm2-panel">
            <h2>{t.statsTitle}</h2>
            <div className="hm2-community-stats">
              <div>
                <strong>{communityCount}</strong>
                <span>{t.detectionsAllUsers}</span>
              </div>
              <div>
                <strong>{totals?.townships ?? 0}</strong>
                <span>{t.townshipsHit}</span>
              </div>
              <div>
                <strong>{totals?.diseases ?? 0}</strong>
                <span>{t.diseaseTypes}</span>
              </div>
            </div>
            <div className="hm2-stat-row">
              {(['critical', 'high', 'medium', 'low', 'none'] as RiskKey[]).map((k) => (
                <div key={k} className={`hm2-stat risk-${k}`}>
                  <strong>{riskCounts[k]}</strong>
                  <span>{riskLabel(k)}</span>
                </div>
              ))}
            </div>
            {(totals?.byDisease?.length ?? 0) > 0 && (
              <ul className="hm2-disease-list hm2-by-disease">
                {totals!.byDisease!.slice(0, 6).map((row) => (
                  <li key={row.disease}>
                    <span>{row.disease}</span>
                    <strong>
                      {row.count} {t.cases}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="hm2-panel">
            <h2>{t.townships}</h2>
            <ul className="hm2-region-list">
              {filteredList.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={selectedId === r.id ? 'is-active' : undefined}
                    onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                  >
                    <i style={{ background: riskColor(r.risk) }} />
                    <span>
                      <strong>{lang === 'my' ? r.nameMy : r.name}</strong>
                      <small>
                        {r.count} {t.cases} · {riskLabel(r.risk)}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selected && (
            <div className={`hm2-panel hm2-detail risk-${selected.risk}`}>
              <div className="hm2-detail-head">
                <h2>{lang === 'my' ? selected.nameMy : selected.name}</h2>
                <button type="button" onClick={() => setSelectedId(null)} aria-label={t.close}>
                  ×
                </button>
              </div>
              <p>
                {t.riskLevel}: <strong>{riskLabel(selected.risk)}</strong> · {selected.count} {t.cases}
              </p>
              <ul className="hm2-disease-list">
                {Object.entries(selected.diseases).length === 0 && (
                  <li className="muted">{t.noDiseaseData}</li>
                )}
                {Object.entries(selected.diseases)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => (
                    <li key={name}>
                      <span>{formatDiseaseLabel(name, lang)}</span>
                      <strong>
                        {count} {t.cases}
                      </strong>
                    </li>
                  ))}
              </ul>
              <p className="hm2-rec">
                <strong>{t.recommendation}:</strong> {t.recommendationText}
              </p>
              <div className="hm2-links">
                <Link className="button compact" to="/detect">
                  {t.viewDetails}
                </Link>
                <Link className="button secondary compact" to="/weather">
                  {t.openWeather}
                </Link>
              </div>
            </div>
          )}

          <div className="hm2-panel">
            <h2>{t.recentTitle}</h2>
            <p className="muted hm2-recent-note">{t.recentNote}</p>
            <ul className="hm2-recent">
              {recent.length === 0 && <li className="muted">{t.noRecent}</li>}
              {recent.slice(0, 10).map((r, i) => {
                const risk = riskFromCount(r.severity && r.severity >= 70 ? 20 : r.severity && r.severity >= 40 ? 8 : 2);
                return (
                  <li key={`${r.disease}-${i}`}>
                    <i style={{ background: riskColor(risk) }} />
                    <div>
                      <strong>
                        {r.disease} — {r.township || '—'}
                      </strong>
                      <small>
                        {timeAgo(r.timestamp, lang)} · {riskLabel(risk)}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hm2-panel">
            <h2>
              <IconWeather /> {t.weatherInsights}
            </h2>
            <p className="muted">{locationLabel}</p>
            <div className="hm2-weather-grid">
              <div>
                <span>{t.temperature}</span>
                <strong>
                  {current?.temperature_2m != null ? `${Math.round(current.temperature_2m)}°C` : '—'}
                </strong>
              </div>
              <div>
                <span>{t.humidity}</span>
                <strong>
                  {current?.relative_humidity_2m != null
                    ? `${Math.round(current.relative_humidity_2m)}%`
                    : '—'}
                </strong>
              </div>
              <div>
                <span>{t.wind}</span>
                <strong>
                  {current?.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : '—'}
                </strong>
              </div>
              <div>
                <span>{t.condition}</span>
                <strong>{weatherLabel(current?.weather_code, lang)}</strong>
              </div>
            </div>
            <div className="hm2-forecast">
              {(daily?.time || []).slice(0, 5).map((day, i) => (
                <article key={day}>
                  <span>
                    {i === 0
                      ? t.today
                      : new Date(day).toLocaleDateString(lang === 'my' ? 'my-MM' : 'en-US', {
                          weekday: 'short',
                        })}
                  </span>
                  <strong>
                    {daily?.temperature_2m_max?.[i] != null
                      ? `${Math.round(daily.temperature_2m_max[i]!)}°`
                      : '—'}
                  </strong>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

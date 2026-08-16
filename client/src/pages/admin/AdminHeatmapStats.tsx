import { useEffect, useMemo, useState } from 'react';
import {
  HEAT_GRADIENT,
  MyanmarHeatMap,
  riskColor,
  type RiskKey,
} from '../../components/MyanmarHeatMap';
import { useAuth } from '../../context/AuthContext';
import { MYANMAR_REGION_META, normalizeRegionKey } from '../../data/myanmarStatesGeo';
import { api } from '../../services/api';

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

type Stats = {
  total: number;
  byDisease: Array<{ _id: string; count: number }>;
  recent: Array<{
    _id: string;
    township?: string;
    disease: string;
    severity: number;
    timestamp?: string;
  }>;
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
  'Healthy',
]);

const TOWNSHIP_COORDS: Record<string, { lng: number; lat: number; region: string }> = {
  Yangon: { lng: 96.1951, lat: 16.8661, region: 'Yangon' },
  Mandalay: { lng: 96.0891, lat: 21.9588, region: 'Mandalay' },
  Naypyidaw: { lng: 96.0785, lat: 19.7633, region: 'Naypyidaw' },
  Bago: { lng: 96.4797, lat: 17.3352, region: 'Bago' },
  Pathein: { lng: 94.735, lat: 16.7792, region: 'Ayeyarwady' },
  Mawlamyine: { lng: 97.6283, lat: 16.4905, region: 'Mon' },
  Taunggyi: { lng: 97.0378, lat: 20.7892, region: 'Shan' },
  Monywa: { lng: 95.1358, lat: 22.1086, region: 'Sagaing' },
  Myitkyina: { lng: 97.3986, lat: 25.3865, region: 'Kachin' },
  Sittwe: { lng: 92.9, lat: 20.1462, region: 'Rakhine' },
  Magway: { lng: 94.9167, lat: 20.15, region: 'Magway' },
  Pyay: { lng: 95.2156, lat: 18.8246, region: 'Bago' },
  Meiktila: { lng: 95.8667, lat: 20.8667, region: 'Mandalay' },
  Lashio: { lng: 97.75, lat: 22.9333, region: 'Shan' },
  Dawei: { lng: 98.1946, lat: 14.0823, region: 'Tanintharyi' },
  'Hpa-An': { lng: 97.6333, lat: 16.8833, region: 'Kayin' },
  Loikaw: { lng: 97.2094, lat: 19.677, region: 'Kayah' },
  Hakha: { lng: 93.6167, lat: 22.65, region: 'Chin' },
  Pakokku: { lng: 94.8833, lat: 21.3333, region: 'Magway' },
  Thanlyin: { lng: 96.25, lat: 16.7667, region: 'Yangon' },
  Taungoo: { lng: 96.4333, lat: 18.9333, region: 'Bago' },
  Kalay: { lng: 94.0167, lat: 23.1833, region: 'Sagaing' },
  Myingyan: { lng: 95.3883, lat: 21.46, region: 'Mandalay' },
  Sagaing: { lng: 95.9667, lat: 21.8833, region: 'Sagaing' },
};

function riskFromCount(count: number): RiskKey {
  if (count >= 20) return 'critical';
  if (count >= 10) return 'high';
  if (count >= 3) return 'medium';
  if (count > 0) return 'low';
  return 'none';
}

function rangeDates(range: RangeKey, day?: string) {
  if (range === 'today') {
    const d = day || new Date().toISOString().slice(0, 10);
    return { day: d };
  }
  const to = new Date();
  const from = new Date();
  if (range === '24h') from.setHours(from.getHours() - 24);
  else if (range === '7d') from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function riskLabel(risk: RiskKey) {
  if (risk === 'critical') return 'Critical';
  if (risk === 'high') return 'High';
  if (risk === 'medium') return 'Medium';
  if (risk === 'low') return 'Low';
  return 'None';
}

export function AdminHeatmapStats() {
  const { accessToken, user } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [aggregates, setAggregates] = useState<AggregateRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [detections, setDetections] = useState<DetectionPoint[]>([]);
  const [totals, setTotals] = useState<HeatmapPayload['totals'] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [range, setRange] = useState<RangeKey>('7d');
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [disease, setDisease] = useState('All');
  const [crop, setCrop] = useState<CropFilter>('all');
  const [base, setBase] = useState<MapBase>('streets');
  const [mode, setMode] = useState<MapMode>('both');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadMap() {
    setLoading(true);
    setError('');
    try {
      const window = rangeDates(range, day);
      const body: Record<string, string> = {};
      if (window.day) body.day = window.day;
      if (window.from) body.from = window.from;
      if (window.to) body.to = window.to;
      if (disease !== 'All') body.disease = disease;
      const data = await api<HeatmapPayload>('/heatmap/filter', { method: 'POST', body });
      setFeatures(data.features || []);
      setAggregates(data.aggregates || []);
      setRecent(data.recent || []);
      setDetections(data.detections || []);
      setTotals(data.totals || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outbreak map');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMap();
    const id = window.setInterval(() => void loadMap(), 45000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, disease, day]);

  useEffect(() => {
    if (user?.role !== 'admin' || !accessToken) return;
    api<Stats>('/heatmap/statistics', { token: accessToken })
      .then(setStats)
      .catch(() => setStats(null));
  }, [accessToken, user?.role]);

  const points = useMemo(() => {
    const countByTown = new Map<string, number>();
    for (const f of features) {
      countByTown.set(f.properties.name, f.properties.outbreakCount || 0);
    }

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
      { id: string; name: string; nameMy: string; count: number; risk: RiskKey }
    > = {};

    for (const f of MYANMAR_REGION_META) {
      map[f.id] = {
        id: f.id,
        name: f.name,
        nameMy: f.nameMy,
        count: 0,
        risk: 'none',
      };
    }

    for (const p of points) {
      const id = normalizeRegionKey(p.region);
      if (!id || !map[id]) continue;
      map[id].count += p.count;
    }

    for (const row of Object.values(map)) {
      row.risk = riskFromCount(row.count);
    }
    return map;
  }, [points]);

  const filteredDetections = useMemo(() => {
    return detections.filter((d) => {
      const name = d.disease || '';
      if (crop === 'rice' && !RICE_DISEASES.has(name)) return false;
      if (crop === 'rice' && !RICE_DISEASES.has(name)) return false;
      return true;
    });
  }, [detections, crop]);

  const topRegions = useMemo(
    () => Object.values(regionStats).sort((a, b) => b.count - a.count).slice(0, 8),
    [regionStats]
  );

  const selected = selectedId ? regionStats[selectedId] : null;
  const diseaseRows = stats?.byDisease?.length
    ? stats.byDisease
    : (totals?.byDisease || []).map((d) => ({ _id: d.disease, count: d.count }));

  const recentRows =
    recent.length > 0
      ? recent
      : (stats?.recent || []).map((r) => ({
          township: r.township,
          disease: r.disease,
          severity: r.severity,
          timestamp: r.timestamp,
        }));

  return (
    <div className="ad-page ad-outbreak">
      <header className="ad-page-head">
        <div>
          <h1>Outbreak map</h1>
          <p>
            Live Myanmar disease intensity — same GeoJSON choropleth and heat layer as the farmer
            heatmap.
          </p>
        </div>
        <button type="button" className="button secondary compact" onClick={() => void loadMap()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {error && <div className="auth-banner error">{error}</div>}

      <div className="ad-outbreak-stats">
        <article>
          <span>Reports in window</span>
          <strong>{(totals?.detections ?? stats?.total ?? 0).toLocaleString()}</strong>
        </article>
        <article>
          <span>Townships touched</span>
          <strong>{totals?.townships ?? 0}</strong>
        </article>
        <article>
          <span>Diseases tracked</span>
          <strong>{totals?.diseases ?? diseaseRows.length}</strong>
        </article>
        <article>
          <span>Detection points</span>
          <strong>{filteredDetections.length}</strong>
        </article>
      </div>

      <div className="ad-outbreak-toolbar">
        <div className="hm2-seg">
          <button type="button" className={mode === 'both' ? 'is-active' : ''} onClick={() => setMode('both')}>
            Disease layer
          </button>
          <button type="button" className={mode === 'heat' ? 'is-active' : ''} onClick={() => setMode('heat')}>
            Heat only
          </button>
          <button
            type="button"
            className={mode === 'regions' ? 'is-active' : ''}
            onClick={() => setMode('regions')}
          >
            Boundaries
          </button>
        </div>
        <div className="hm2-filters">
          <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>
            <option value="today">Today</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          {range === 'today' && (
            <input
              type="date"
              value={day}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDay(e.target.value)}
            />
          )}
          <select value={disease} onChange={(e) => setDisease(e.target.value)}>
            {DISEASES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={crop} onChange={(e) => setCrop(e.target.value as CropFilter)}>
            <option value="all">All crops</option>
            <option value="rice">Rice</option>
          </select>
          <select value={base} onChange={(e) => setBase(e.target.value as MapBase)}>
            <option value="streets">Streets</option>
            <option value="satellite">Satellite</option>
          </select>
        </div>
      </div>

      <div className="ad-outbreak-layout">
        <div className="ad-outbreak-map-card">
          <MyanmarHeatMap
            points={points}
            detections={filteredDetections}
            regionStats={regionStats}
            base={base}
            mode={mode}
            selectedId={selectedId}
            lang="en"
            onSelectRegion={setSelectedId}
          />
          <div className="ad-outbreak-legend">
            <span>Intensity</span>
            <div
              className="ad-outbreak-ramp"
              style={{
                background: `linear-gradient(90deg, ${Object.values(HEAT_GRADIENT).join(',')})`,
              }}
            />
            <small>Low</small>
            <small>High</small>
          </div>
        </div>

        <aside className="ad-outbreak-side">
          <section className="ad-panel">
            <header className="ad-section-head">
              <h2>Disease totals</h2>
            </header>
            <ul className="ad-outbreak-list">
              {diseaseRows.slice(0, 8).map((d) => (
                <li key={d._id || 'unknown'}>
                  <strong>{d._id || 'Unknown'}</strong>
                  <span>{d.count}</span>
                </li>
              ))}
              {diseaseRows.length === 0 && <li className="muted">No disease counts yet.</li>}
            </ul>
          </section>

          <section className="ad-panel">
            <header className="ad-section-head">
              <h2>{selected ? selected.name : 'Top regions'}</h2>
            </header>
            {selected ? (
              <div className="ad-outbreak-selected">
                <p>
                  <strong>{selected.count}</strong> reports · {riskLabel(selected.risk)}
                </p>
                <span
                  className="ad-outbreak-risk"
                  style={{ background: riskColor(selected.risk) }}
                />
                <button type="button" className="secondary compact" onClick={() => setSelectedId(null)}>
                  Clear selection
                </button>
              </div>
            ) : (
              <ul className="ad-outbreak-list">
                {topRegions.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="ad-outbreak-region-btn" onClick={() => setSelectedId(r.id)}>
                      <strong>{r.name}</strong>
                      <span style={{ color: riskColor(r.risk) }}>{r.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ad-panel">
            <header className="ad-section-head">
              <h2>Recent reports</h2>
            </header>
            <ul className="ad-outbreak-recent">
              {recentRows.slice(0, 8).map((r, i) => (
                <li key={`${r.disease}-${r.timestamp}-${i}`}>
                  <strong>{r.disease || 'Unknown'}</strong>
                  <span>
                    {r.township || '—'}
                    {r.severity != null ? ` · sev ${r.severity}` : ''} · {timeAgo(r.timestamp)}
                  </span>
                </li>
              ))}
              {recentRows.length === 0 && <li className="muted">No recent reports in this window.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

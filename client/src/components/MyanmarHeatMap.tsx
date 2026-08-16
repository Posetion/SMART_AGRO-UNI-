import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import {
  loadMyanmarStatesGeo,
  normalizeRegionKey,
  type MmFeature,
  type MmFeatureCollection,
} from '../data/myanmarStatesGeo';

export type RiskKey = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type MapBase = 'streets' | 'satellite';
export type MapMode = 'heat' | 'regions' | 'both';

export type TownshipPoint = {
  name: string;
  region: string;
  lat: number;
  lng: number;
  count: number;
  risk: RiskKey;
};

export type RegionStat = {
  id: string;
  name: string;
  nameMy: string;
  count: number;
  risk: RiskKey;
};

type Props = {
  points: TownshipPoint[];
  detections?: Array<{ lat: number; lng: number; disease?: string; severity?: number }>;
  regionStats: Record<string, RegionStat>;
  base: MapBase;
  mode: MapMode;
  selectedId: string | null;
  lang: 'en' | 'my';
  onSelectRegion: (id: string | null) => void;
  locate?: { lat: number; lng: number } | null;
};

/** CHIRTS-style blue → yellow → red ramp (disease intensity). */
export const HEAT_GRADIENT: Record<number, string> = {
  0.0: '#1e88e5',
  0.12: '#4fc3f7',
  0.24: '#66bb6a',
  0.36: '#c0ca33',
  0.48: '#fdd835',
  0.6: '#ffb300',
  0.72: '#fb8c00',
  0.84: '#e53935',
  1.0: '#8b0000',
};

const HEAT_STOPS = Object.entries(HEAT_GRADIENT)
  .map(([k, v]) => ({ t: Number(k), c: v }))
  .sort((a, b) => a.t - b.t);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export function intensityColor(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < HEAT_STOPS.length - 1 && HEAT_STOPS[i + 1]!.t < x) i += 1;
  const a = HEAT_STOPS[i]!;
  const b = HEAT_STOPS[Math.min(i + 1, HEAT_STOPS.length - 1)]!;
  if (a.t === b.t) return a.c;
  const u = (x - a.t) / (b.t - a.t);
  const [ar, ag, ab] = hexToRgb(a.c);
  const [br, bg, bb] = hexToRgb(b.c);
  return rgbToHex(ar + (br - ar) * u, ag + (bg - ag) * u, ab + (bb - ab) * u);
}

export function riskColor(risk: RiskKey): string {
  switch (risk) {
    case 'critical':
      return intensityColor(1);
    case 'high':
      return intensityColor(0.82);
    case 'medium':
      return intensityColor(0.58);
    case 'low':
      return intensityColor(0.32);
    default:
      return intensityColor(0.08);
  }
}

export function countIntensity(count: number): number {
  if (count <= 0) return 0.06;
  if (count >= 20) return 1;
  if (count >= 10) return 0.78;
  if (count >= 5) return 0.58;
  if (count >= 3) return 0.42;
  return 0.28;
}

export function MyanmarHeatMap({
  points,
  detections = [],
  regionStats,
  base,
  mode,
  selectedId,
  lang,
  onSelectRegion,
  locate,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const heatRef = useRef<L.Layer | null>(null);
  const regionsRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const locateRef = useRef<L.CircleMarker | null>(null);
  const onSelectRef = useRef(onSelectRegion);
  const [geo, setGeo] = useState<MmFeatureCollection | null>(null);
  const [geoError, setGeoError] = useState('');
  onSelectRef.current = onSelectRegion;

  useEffect(() => {
    let cancelled = false;
    void loadMyanmarStatesGeo()
      .then((data) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {
        if (!cancelled) setGeoError('Could not load Myanmar borders');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [19.7, 96.1],
      zoom: 6,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    map.fitBounds(
      L.latLngBounds([
        [9.4, 92.1],
        [28.6, 101.3],
      ]),
      { padding: [20, 20] }
    );

    return () => {
      map.remove();
      mapRef.current = null;
      tilesRef.current = null;
      heatRef.current = null;
      regionsRef.current = null;
      markersRef.current = null;
      locateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tilesRef.current) {
      map.removeLayer(tilesRef.current);
      tilesRef.current = null;
    }

    const layer =
      base === 'satellite'
        ? L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            { attribution: 'Tiles © Esri', maxZoom: 18 }
          )
        : L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19,
          });

    layer.addTo(map);
    tilesRef.current = layer;
  }, [base]);

  const geoFittedRef = useRef(false);

  // Real admin borders + choropleth fill (temperature-map style)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geo) return;

    if (regionsRef.current) {
      map.removeLayer(regionsRef.current);
      regionsRef.current = null;
    }

    const showFill = mode !== 'heat';
    const showHeatOutline = mode === 'heat';

    const layer = L.geoJSON(geo as GeoJSON.FeatureCollection, {
      style: (feat) => {
        const id = (feat?.properties as { id?: string } | undefined)?.id || '';
        const count = regionStats[id]?.count ?? 0;
        const selected = selectedId === id;
        const fill = intensityColor(countIntensity(count));

        return {
          color: selected ? '#37474f' : '#607d8b',
          weight: selected ? 1.6 : 0.85,
          opacity: 0.95,
          fillColor: fill,
          fillOpacity: showHeatOutline
            ? count > 0
              ? 0.2
              : 0.08
            : count <= 0
              ? 0.28
              : selected
                ? 0.82
                : 0.72,
        };
      },
      onEachFeature: (feat, path) => {
        const props = feat.properties as MmFeature['properties'];
        const id = props.id;
        const stat = regionStats[id];
        const label = lang === 'my' ? props.nameMy : props.name;
        path.bindTooltip(
          `<strong>${label}</strong><br/>${stat?.count ?? 0} cases · ${stat?.risk ?? 'none'}`,
          { sticky: true, className: 'hm-leaflet-tip' }
        );
        path.on({
          click: () => onSelectRef.current(selectedId === id ? null : id),
          mouseover: (e) => {
            const target = e.target as L.Path;
            target.setStyle({
              weight: 1.8,
              fillOpacity: showFill ? 0.88 : 0.28,
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              target.bringToFront();
            }
          },
          mouseout: (e) => {
            const target = e.target as L.Path;
            const count = regionStats[id]?.count ?? 0;
            const selected = selectedId === id;
            target.setStyle({
              weight: selected ? 1.6 : 0.85,
              fillOpacity: showHeatOutline
                ? count > 0
                  ? 0.2
                  : 0.08
                : count <= 0
                  ? 0.28
                  : selected
                    ? 0.82
                    : 0.72,
            });
          },
        });
      },
    });

    layer.addTo(map);
    regionsRef.current = layer;

    if (!geoFittedRef.current) {
      try {
        const b = layer.getBounds();
        if (b.isValid()) {
          map.fitBounds(b, { padding: [28, 28], maxZoom: 7 });
          geoFittedRef.current = true;
        }
      } catch {
        /* ignore */
      }
    }
  }, [geo, mode, regionStats, selectedId, lang]);

  // Point heat — only on top of detections / townships (no jitter outside borders)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markersRef.current) return;

    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }
    markersRef.current.clearLayers();

    if (mode === 'regions') return;

    const heatData: Array<[number, number, number]> = [];

    for (const d of detections) {
      if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) continue;
      const sev = d.severity ?? 40;
      heatData.push([d.lat, d.lng, Math.min(1, 0.45 + sev / 100)]);
    }

    if (heatData.length === 0) {
      for (const p of points) {
        if (p.count <= 0) continue;
        heatData.push([p.lat, p.lng, countIntensity(p.count)]);
      }
    }

    if (heatData.length > 0) {
      const heat = L.heatLayer(heatData, {
        radius: 28,
        blur: 22,
        maxZoom: 12,
        max: 1,
        minOpacity: 0.4,
        gradient: HEAT_GRADIENT,
      });
      heat.addTo(map);
      heatRef.current = heat;
    }

    if (mode === 'both') {
      for (const p of points) {
        if (p.count <= 0) continue;
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: Math.min(8, 3.2 + Math.sqrt(p.count) * 1.2),
          color: '#455a64',
          weight: 1,
          fillColor: intensityColor(countIntensity(p.count)),
          fillOpacity: 0.95,
        });
        marker.bindPopup(
          `<div class="hm-popup"><strong>${p.name}</strong><br/>${p.region}<br/><span>${p.count} cases</span></div>`
        );
        marker.on('click', () => {
          const id = normalizeRegionKey(p.region);
          if (id) onSelectRef.current(id);
        });
        markersRef.current.addLayer(marker);
      }
    }
  }, [points, detections, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (locateRef.current) {
      map.removeLayer(locateRef.current);
      locateRef.current = null;
    }
    if (!locate) return;

    const m = L.circleMarker([locate.lat, locate.lng], {
      radius: 8,
      color: '#0d47a1',
      weight: 2,
      fillColor: '#42a5f5',
      fillOpacity: 0.9,
    }).addTo(map);
    locateRef.current = m;
    map.flyTo([locate.lat, locate.lng], Math.max(map.getZoom(), 8), { duration: 0.8 });
  }, [locate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId || !regionsRef.current) return;
    let bounds: L.LatLngBounds | null = null;
    regionsRef.current.eachLayer((layer) => {
      const feat = (layer as L.GeoJSON & { feature?: GeoJSON.Feature }).feature;
      const id = (feat?.properties as { id?: string } | undefined)?.id;
      if (id === selectedId && 'getBounds' in layer) {
        const b = (layer as L.Polygon).getBounds();
        bounds = bounds ? bounds.extend(b) : b;
      }
    });
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }, [selectedId]);

  return (
    <div className="hm-leaflet-wrap">
      <div ref={containerRef} className="hm-leaflet" />
      {geoError && <p className="hm-leaflet-error">{geoError}</p>}
    </div>
  );
}

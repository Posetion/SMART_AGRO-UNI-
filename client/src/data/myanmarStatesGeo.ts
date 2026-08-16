/**
 * Myanmar Admin-1 boundaries — geometry loaded from /geo/myanmar-states.geojson
 * (MIMU / laravel-geo-json-myanmar), not hand-drawn polygons.
 */

export type MmStateProps = {
  id: string;
  name: string;
  nameMy: string;
  stSource?: string;
};

export type MmFeature = {
  type: 'Feature';
  properties: MmStateProps;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
};

export type MmFeatureCollection = {
  type: 'FeatureCollection';
  features: MmFeature[];
};

/** Unique regions for stats sidebar (geometry may have multiple features per id). */
export const MYANMAR_REGION_META: MmStateProps[] = [
  { id: 'kachin', name: 'Kachin', nameMy: 'ကချင်' },
  { id: 'sagaing', name: 'Sagaing', nameMy: 'စစ်ကိုင်း' },
  { id: 'chin', name: 'Chin', nameMy: 'ချင်း' },
  { id: 'shan', name: 'Shan', nameMy: 'ရှမ်း' },
  { id: 'rakhine', name: 'Rakhine', nameMy: 'ရခိုင်' },
  { id: 'magway', name: 'Magway', nameMy: 'မကွေး' },
  { id: 'mandalay', name: 'Mandalay', nameMy: 'မန္တလေး' },
  { id: 'naypyidaw', name: 'Naypyidaw', nameMy: 'နေပြည်တော်' },
  { id: 'kayah', name: 'Kayah', nameMy: 'ကယား' },
  { id: 'bago', name: 'Bago', nameMy: 'ပဲခူး' },
  { id: 'yangon', name: 'Yangon', nameMy: 'ရန်ကုန်' },
  { id: 'ayeyarwady', name: 'Ayeyarwady', nameMy: 'ဧရာဝတီ' },
  { id: 'kayin', name: 'Kayin', nameMy: 'ကရင်' },
  { id: 'mon', name: 'Mon', nameMy: 'မွန်' },
  { id: 'tanintharyi', name: 'Tanintharyi', nameMy: 'တနင်္သာရီ' },
];

/** @deprecated Prefer loadMyanmarStatesGeo() — kept for sync callers that only need meta. */
export const MYANMAR_STATES_GEOJSON: MmFeatureCollection = {
  type: 'FeatureCollection',
  features: MYANMAR_REGION_META.map((p) => ({
    type: 'Feature',
    properties: p,
    geometry: { type: 'Polygon', coordinates: [] },
  })),
};

let cachedGeo: MmFeatureCollection | null = null;
let loadPromise: Promise<MmFeatureCollection> | null = null;

export async function loadMyanmarStatesGeo(): Promise<MmFeatureCollection> {
  if (cachedGeo) return cachedGeo;
  if (!loadPromise) {
    loadPromise = fetch('/geo/myanmar-states.geojson')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load Myanmar borders (${res.status})`);
        const data = (await res.json()) as MmFeatureCollection;
        cachedGeo = data;
        return data;
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }
  return loadPromise;
}

export function normalizeRegionKey(name?: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const aliases: Record<string, string> = {
    kachin: 'kachin',
    sagaing: 'sagaing',
    chin: 'chin',
    shan: 'shan',
    'shan (east)': 'shan',
    'shan (north)': 'shan',
    'shan (south)': 'shan',
    rakhine: 'rakhine',
    arakan: 'rakhine',
    magway: 'magway',
    magwe: 'magway',
    mandalay: 'mandalay',
    naypyidaw: 'naypyidaw',
    'nay pyi taw': 'naypyidaw',
    kayah: 'kayah',
    karenni: 'kayah',
    bago: 'bago',
    'bago (east)': 'bago',
    'bago (west)': 'bago',
    pegu: 'bago',
    yangon: 'yangon',
    rangoon: 'yangon',
    ayeyarwady: 'ayeyarwady',
    ayeyarwaddy: 'ayeyarwady',
    irrawaddy: 'ayeyarwady',
    kayin: 'kayin',
    karen: 'kayin',
    mon: 'mon',
    tanintharyi: 'tanintharyi',
    tenasserim: 'tanintharyi',
  };
  if (aliases[n]) return aliases[n];
  // Longer keys first so "kachin" wins over "chin"
  const ordered = Object.entries(aliases).sort((a, b) => b[0].length - a[0].length);
  for (const [k, id] of ordered) {
    if (n.includes(k)) return id;
  }
  return null;
}

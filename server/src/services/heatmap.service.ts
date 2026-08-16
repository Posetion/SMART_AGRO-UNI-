import { DiseaseLocation } from '../models/DiseaseLocation.js';
import { TownshipBoundary } from '../models/TownshipBoundary.js';

/** Canonical township centroids used to snap free-text / GPS detections onto the map. */
export const TOWNSHIP_COORDS: Record<string, { lng: number; lat: number; region: string }> = {
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

const DISEASE_CANONICAL: Record<string, string> = {
  blast: 'Blast',
  'rice blast': 'Blast',
  'leaf blast': 'Blast',
  'brown spot': 'Brown Spot',
  'bacterial leaf blight': 'Bacterial Leaf Blight',
  blb: 'Bacterial Leaf Blight',
  'sheath blight': 'Sheath Blight',
  'leaf scald': 'Leaf Scald',
  'leaf smut': 'Leaf Smut',
  tungro: 'Tungro',
  'false smut': 'False Smut',
  'narrow brown spot': 'Narrow Brown Spot',
  'narrow brown leaf spot': 'Narrow Brown Spot',
  'bacterial leaf streak': 'Bacterial Leaf Streak',
  'sheath rot': 'Sheath Rot',
  bakanae: 'Bakanae',
  'stem rot': 'Stem Rot',
  'yellow stem borer': 'Yellow Stem Borer',
  'stem borer': 'Yellow Stem Borer',
  'pink stem borer': 'Pink Stem Borer',
  'sesamia': 'Pink Stem Borer',
  'brown planthopper': 'Brown Planthopper',
  bph: 'Brown Planthopper',
  'whitebacked planthopper': 'Whitebacked Planthopper',
  'white-backed planthopper': 'Whitebacked Planthopper',
  wbph: 'Whitebacked Planthopper',
  'green leafhopper': 'Green Leafhopper',
  glh: 'Green Leafhopper',
  'rice leaf folder': 'Rice Leaf Folder',
  'leaf folder': 'Rice Leaf Folder',
  'rice caseworm': 'Rice Caseworm',
  caseworm: 'Rice Caseworm',
  'rice gall midge': 'Rice Gall Midge',
  'gall midge': 'Rice Gall Midge',
  'rice hispa': 'Rice Hispa',
  hispa: 'Rice Hispa',
  'whorl maggot': 'Whorl Maggot',
  'rice whorl maggot': 'Whorl Maggot',
  'rice armyworm': 'Rice Armyworm',
  armyworm: 'Rice Armyworm',
  'swarming caterpillar': 'Rice Armyworm',
  'rice bug': 'Rice Bug',
  'gundhi bug': 'Rice Bug',
  'ear bug': 'Rice Bug',
  'rice thrips': 'Rice Thrips',
  thrips: 'Rice Thrips',
  healthy: 'Healthy',
  'healthy rice leaf': 'Healthy',
};

export function normalizeDiseaseName(raw?: string): string {
  if (!raw?.trim()) return 'Unknown';
  const key = raw.trim().toLowerCase();
  return DISEASE_CANONICAL[key] || raw.trim();
}

export function diseaseMatchValues(filter?: string): string[] | null {
  if (!filter?.trim() || filter === 'All') return null;
  const canon = normalizeDiseaseName(filter);
  const aliases = Object.entries(DISEASE_CANONICAL)
    .filter(([, v]) => v === canon)
    .map(([k]) => k);
  // Include both canonical and common display forms
  const values = new Set<string>([canon, filter.trim()]);
  if (canon === 'Blast') {
    values.add('Rice Blast');
    values.add('Leaf Blast');
  }
  for (const a of aliases) {
    // restore title-ish originals already covered by canon
    void a;
  }
  return [...values];
}

export function nearestTownship(
  lat: number,
  lng: number,
  hint?: string
): { township: string; region: string } {
  const hintKey = hint?.trim();
  if (hintKey) {
    const exact = Object.keys(TOWNSHIP_COORDS).find(
      (k) => k.toLowerCase() === hintKey.toLowerCase()
    );
    if (exact) {
      return { township: exact, region: TOWNSHIP_COORDS[exact].region };
    }
    // Partial match e.g. "Yangon Region" / reverse-geocode suburb near a known town
    const partial = Object.keys(TOWNSHIP_COORDS).find((k) =>
      hintKey.toLowerCase().includes(k.toLowerCase())
    );
    if (partial) {
      return { township: partial, region: TOWNSHIP_COORDS[partial].region };
    }
  }

  let best = 'Yangon';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const [name, c] of Object.entries(TOWNSHIP_COORDS)) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return { township: best, region: TOWNSHIP_COORDS[best].region };
}

function riskFromCount(count: number): string {
  if (count >= 10) return 'High';
  if (count >= 3) return 'Medium';
  return 'Low';
}

/** Asia/Yangon calendar-day bounds (UTC dates approximating UTC+6:30). */
export function myanmarDayBounds(dayIso?: string): { from: Date; to: Date } {
  // Myanmar is UTC+6:30. Represent "local day" as that offset.
  const OFFSET_MS = 6.5 * 60 * 60 * 1000;
  const base = dayIso ? new Date(dayIso) : new Date();
  const local = new Date(base.getTime() + OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const from = new Date(Date.UTC(y, m, d, 0, 0, 0) - OFFSET_MS);
  const to = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - OFFSET_MS);
  return { from, to };
}

type HeatFilters = {
  disease?: string;
  from?: Date;
  to?: Date;
  day?: string;
};

export async function getHeatmapData(filters?: HeatFilters) {
  const match: Record<string, unknown> = {};

  let from = filters?.from;
  let to = filters?.to;
  if (filters?.day) {
    const bounds = myanmarDayBounds(filters.day);
    from = bounds.from;
    to = bounds.to;
  }

  const diseaseValues = diseaseMatchValues(filters?.disease);
  if (diseaseValues?.length) {
    match.disease = { $in: diseaseValues };
  }

  if (from || to) {
    match.timestamp = {};
    if (from) (match.timestamp as Record<string, Date>).$gte = from;
    if (to) (match.timestamp as Record<string, Date>).$lte = to;
  }

  // All users' detections in range (DiseaseLocation has no user filter by design)
  const rows = await DiseaseLocation.find(match)
    .sort({ timestamp: -1 })
    .select('location township disease severity timestamp diagnosticId')
    .lean();

  const detections = rows.map((r) => {
    const coords = r.location?.coordinates || [0, 0];
    const lng = Number(coords[0]) || 0;
    const lat = Number(coords[1]) || 0;
    const snapped = nearestTownship(lat, lng, r.township);
    const disease = normalizeDiseaseName(r.disease);
    return {
      id: String(r._id),
      lat,
      lng,
      township: snapped.township,
      region: snapped.region,
      disease,
      severity: r.severity ?? 0,
      timestamp: r.timestamp,
    };
  });

  const counts = new Map<string, number>();
  const diseaseTownCounts = new Map<string, { township: string; disease: string; count: number; severitySum: number }>();

  for (const d of detections) {
    counts.set(d.township, (counts.get(d.township) ?? 0) + 1);
    const key = `${d.township}::${d.disease}`;
    const prev = diseaseTownCounts.get(key) || {
      township: d.township,
      disease: d.disease,
      count: 0,
      severitySum: 0,
    };
    prev.count += 1;
    prev.severitySum += d.severity;
    diseaseTownCounts.set(key, prev);
  }

  const aggregates = [...diseaseTownCounts.values()].map((row) => ({
    _id: { township: row.township, disease: row.disease },
    count: row.count,
    avgSeverity: row.count ? row.severitySum / row.count : 0,
  }));

  const boundaries = await TownshipBoundary.find();
  const features = boundaries.map((b) => {
    const outbreakCount = counts.get(b.name) ?? 0;
    const riskLevel = riskFromCount(outbreakCount);
    return {
      type: 'Feature',
      properties: {
        name: b.name,
        region: b.region,
        outbreakCount,
        riskLevel,
        color: riskLevel === 'High' ? 'Red' : riskLevel === 'Medium' ? 'Yellow' : 'Green',
      },
      geometry: b.geometry,
    };
  });

  // Also emit features for townships that have detections but no boundary polygon
  for (const [name, outbreakCount] of counts) {
    if (features.some((f) => f.properties.name === name)) continue;
    const meta = TOWNSHIP_COORDS[name];
    if (!meta) continue;
    const riskLevel = riskFromCount(outbreakCount);
    features.push({
      type: 'Feature',
      properties: {
        name,
        region: meta.region,
        outbreakCount,
        riskLevel,
        color: riskLevel === 'High' ? 'Red' : riskLevel === 'Medium' ? 'Yellow' : 'Green',
      },
      geometry: {
        type: 'Point',
        coordinates: [meta.lng, meta.lat],
      } as unknown as typeof features[0]['geometry'],
    });
  }

  const byDiseaseMap = new Map<string, number>();
  for (const d of detections) {
    byDiseaseMap.set(d.disease, (byDiseaseMap.get(d.disease) ?? 0) + 1);
  }

  const recent = detections.slice(0, 20).map((d) => ({
    township: d.township,
    disease: d.disease,
    severity: d.severity,
    timestamp: d.timestamp,
  }));

  return {
    type: 'FeatureCollection',
    features,
    aggregates,
    recent,
    detections,
    totals: {
      detections: detections.length,
      townships: counts.size,
      diseases: byDiseaseMap.size,
      byDisease: [...byDiseaseMap.entries()]
        .map(([disease, count]) => ({ disease, count }))
        .sort((a, b) => b.count - a.count),
    },
    range: {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
  };
}

export async function getTownshipBoundaries() {
  const items = await TownshipBoundary.find();
  return {
    type: 'FeatureCollection',
    features: items.map((b) => ({
      type: 'Feature',
      properties: {
        name: b.name,
        region: b.region,
        riskLevel: b.riskLevel,
        outbreakCount: b.outbreakCount,
      },
      geometry: b.geometry,
    })),
  };
}

export async function filterHeatmap(body: {
  disease?: string;
  from?: string;
  to?: string;
  day?: string;
}) {
  return getHeatmapData({
    disease: body.disease,
    day: body.day,
    from: body.from ? new Date(body.from) : undefined,
    to: body.to ? new Date(body.to) : undefined,
  });
}

export async function getStatistics() {
  const [total, byDisease, recent] = await Promise.all([
    DiseaseLocation.countDocuments(),
    DiseaseLocation.aggregate([{ $group: { _id: '$disease', count: { $sum: 1 } } }]),
    DiseaseLocation.find().sort({ timestamp: -1 }).limit(20),
  ]);
  return { total, byDisease, recent };
}

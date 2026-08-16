/**
 * Temporary demo heatmap — a dense week of sample detections so the map
 * looks full for shows. Replace with live /heatmap/filter data later.
 */

export type DemoRange = 'today' | '24h' | '7d' | '30d';

export type DemoDetection = {
  lat: number;
  lng: number;
  township: string;
  region: string;
  disease: string;
  severity: number;
  timestamp: string;
};

export type DemoFeature = {
  properties: {
    name: string;
    region: string;
    outbreakCount: number;
    riskLevel: string;
  };
};

export type DemoAggregate = {
  _id: { township?: string; disease?: string };
  count: number;
};

export type DemoRecent = {
  township?: string;
  disease?: string;
  severity?: number;
  timestamp?: string;
};

export type DemoHeatmapPayload = {
  features: DemoFeature[];
  aggregates: DemoAggregate[];
  recent: DemoRecent[];
  detections: DemoDetection[];
  totals: {
    detections: number;
    townships: number;
    diseases: number;
    byDisease: Array<{ disease: string; count: number }>;
  };
};

export const DEMO_TOWNSHIPS: Record<string, { lng: number; lat: number; region: string }> = {
  Yangon: { lng: 96.1951, lat: 16.8661, region: 'Yangon' },
  Thanlyin: { lng: 96.25, lat: 16.7667, region: 'Yangon' },
  Hlegu: { lng: 96.22, lat: 17.098, region: 'Yangon' },
  Twante: { lng: 95.933, lat: 16.71, region: 'Yangon' },
  Hmawbi: { lng: 96.055, lat: 17.105, region: 'Yangon' },
  Pathein: { lng: 94.735, lat: 16.7792, region: 'Ayeyarwady' },
  Hinthada: { lng: 95.46, lat: 17.65, region: 'Ayeyarwady' },
  Maubin: { lng: 95.654, lat: 16.731, region: 'Ayeyarwady' },
  Myaungmya: { lng: 94.929, lat: 16.604, region: 'Ayeyarwady' },
  Labutta: { lng: 94.761, lat: 16.143, region: 'Ayeyarwady' },
  Bogale: { lng: 95.397, lat: 16.294, region: 'Ayeyarwady' },
  Bago: { lng: 96.4797, lat: 17.3352, region: 'Bago' },
  Pyay: { lng: 95.2156, lat: 18.8246, region: 'Bago' },
  Taungoo: { lng: 96.4333, lat: 18.9333, region: 'Bago' },
  Nyaunglebin: { lng: 96.722, lat: 17.954, region: 'Bago' },
  Tharrawaddy: { lng: 95.798, lat: 17.654, region: 'Bago' },
  Mandalay: { lng: 96.0891, lat: 21.9588, region: 'Mandalay' },
  Meiktila: { lng: 95.8667, lat: 20.8667, region: 'Mandalay' },
  Myingyan: { lng: 95.3883, lat: 21.46, region: 'Mandalay' },
  'Pyin Oo Lwin': { lng: 96.47, lat: 22.035, region: 'Mandalay' },
  Yamethin: { lng: 96.144, lat: 20.43, region: 'Mandalay' },
  Kyaukse: { lng: 96.13, lat: 21.613, region: 'Mandalay' },
  Naypyidaw: { lng: 96.0785, lat: 19.7633, region: 'Naypyidaw' },
  Mawlamyine: { lng: 97.6283, lat: 16.4905, region: 'Mon' },
  Thaton: { lng: 97.37, lat: 16.92, region: 'Mon' },
  Mudon: { lng: 97.716, lat: 16.258, region: 'Mon' },
  Taunggyi: { lng: 97.0378, lat: 20.7892, region: 'Shan' },
  Lashio: { lng: 97.75, lat: 22.9333, region: 'Shan' },
  Monywa: { lng: 95.1358, lat: 22.1086, region: 'Sagaing' },
  Sagaing: { lng: 95.9667, lat: 21.8833, region: 'Sagaing' },
  Kalay: { lng: 94.0167, lat: 23.1833, region: 'Sagaing' },
  Shwebo: { lng: 95.7, lat: 22.569, region: 'Sagaing' },
  Myitkyina: { lng: 97.3986, lat: 25.3865, region: 'Kachin' },
  Sittwe: { lng: 92.9, lat: 20.1462, region: 'Rakhine' },
  Magway: { lng: 94.9167, lat: 20.15, region: 'Magway' },
  Pakokku: { lng: 94.8833, lat: 21.3333, region: 'Magway' },
  Dawei: { lng: 98.1946, lat: 14.0823, region: 'Tanintharyi' },
  'Hpa-An': { lng: 97.6333, lat: 16.8833, region: 'Kayin' },
  Loikaw: { lng: 97.2094, lat: 19.677, region: 'Kayah' },
  Hakha: { lng: 93.6167, lat: 22.65, region: 'Chin' },
};

type Cluster = {
  township: string;
  count: number;
  diseases: string[];
  severityMin: number;
  severityMax: number;
  spread: number;
};

const CLUSTERS: Cluster[] = [
  { township: 'Pathein', count: 48, diseases: ['Blast', 'Brown Planthopper', 'Sheath Blight'], severityMin: 74, severityMax: 98, spread: 0.32 },
  { township: 'Hinthada', count: 32, diseases: ['Blast', 'Bacterial Leaf Blight', 'Brown Planthopper'], severityMin: 70, severityMax: 95, spread: 0.26 },
  { township: 'Maubin', count: 22, diseases: ['Sheath Blight', 'Blast', 'Rice Leaf Folder'], severityMin: 68, severityMax: 92, spread: 0.22 },
  { township: 'Myaungmya', count: 18, diseases: ['Blast', 'Brown Spot'], severityMin: 66, severityMax: 90, spread: 0.2 },
  { township: 'Labutta', count: 16, diseases: ['Brown Planthopper', 'Tungro'], severityMin: 72, severityMax: 96, spread: 0.22 },
  { township: 'Bogale', count: 14, diseases: ['Blast', 'Sheath Blight'], severityMin: 64, severityMax: 88, spread: 0.2 },
  { township: 'Yangon', count: 38, diseases: ['Bacterial Leaf Blight', 'Blast', 'Brown Spot'], severityMin: 70, severityMax: 96, spread: 0.18 },
  { township: 'Thanlyin', count: 16, diseases: ['Blast', 'Rice Leaf Folder'], severityMin: 62, severityMax: 88, spread: 0.14 },
  { township: 'Hlegu', count: 10, diseases: ['Brown Spot', 'Sheath Blight'], severityMin: 55, severityMax: 82, spread: 0.16 },
  { township: 'Twante', count: 8, diseases: ['Bacterial Leaf Blight'], severityMin: 50, severityMax: 78, spread: 0.14 },
  { township: 'Hmawbi', count: 8, diseases: ['Blast', 'Narrow Brown Spot'], severityMin: 48, severityMax: 76, spread: 0.14 },
  { township: 'Bago', count: 22, diseases: ['Sheath Blight', 'Blast', 'Bacterial Leaf Blight'], severityMin: 68, severityMax: 93, spread: 0.24 },
  { township: 'Pyay', count: 14, diseases: ['Brown Spot', 'Blast'], severityMin: 58, severityMax: 86, spread: 0.2 },
  { township: 'Taungoo', count: 10, diseases: ['Rice Leaf Folder', 'Brown Spot'], severityMin: 52, severityMax: 80, spread: 0.18 },
  { township: 'Nyaunglebin', count: 8, diseases: ['Blast', 'Sheath Rot'], severityMin: 50, severityMax: 78, spread: 0.16 },
  { township: 'Tharrawaddy', count: 6, diseases: ['Bacterial Leaf Streak'], severityMin: 42, severityMax: 70, spread: 0.14 },
  { township: 'Mandalay', count: 22, diseases: ['Brown Spot', 'Blast', 'Rice Leaf Folder'], severityMin: 64, severityMax: 90, spread: 0.2 },
  { township: 'Meiktila', count: 12, diseases: ['Brown Spot', 'Stem Rot'], severityMin: 55, severityMax: 84, spread: 0.16 },
  { township: 'Myingyan', count: 8, diseases: ['Blast', 'Rice Thrips'], severityMin: 48, severityMax: 76, spread: 0.16 },
  { township: 'Pyin Oo Lwin', count: 6, diseases: ['Brown Spot'], severityMin: 36, severityMax: 62, spread: 0.12 },
  { township: 'Yamethin', count: 5, diseases: ['Rice Leaf Folder'], severityMin: 40, severityMax: 68, spread: 0.14 },
  { township: 'Kyaukse', count: 5, diseases: ['Blast', 'Bakanae'], severityMin: 44, severityMax: 72, spread: 0.12 },
  { township: 'Naypyidaw', count: 12, diseases: ['Brown Spot', 'Bacterial Leaf Blight'], severityMin: 50, severityMax: 80, spread: 0.18 },
  { township: 'Mawlamyine', count: 10, diseases: ['Tungro', 'Leaf Scald', 'Blast'], severityMin: 52, severityMax: 82, spread: 0.16 },
  { township: 'Thaton', count: 4, diseases: ['Bacterial Leaf Blight'], severityMin: 40, severityMax: 68, spread: 0.12 },
  { township: 'Mudon', count: 4, diseases: ['Sheath Blight'], severityMin: 38, severityMax: 64, spread: 0.1 },
  { township: 'Monywa', count: 8, diseases: ['Brown Spot', 'Rice Bug'], severityMin: 46, severityMax: 74, spread: 0.16 },
  { township: 'Sagaing', count: 6, diseases: ['Blast'], severityMin: 42, severityMax: 70, spread: 0.12 },
  { township: 'Kalay', count: 4, diseases: ['Rice Hispa'], severityMin: 34, severityMax: 58, spread: 0.14 },
  { township: 'Shwebo', count: 5, diseases: ['Brown Spot', 'Yellow Stem Borer'], severityMin: 40, severityMax: 68, spread: 0.14 },
  { township: 'Magway', count: 10, diseases: ['Brown Spot', 'Rice Leaf Folder'], severityMin: 48, severityMax: 78, spread: 0.18 },
  { township: 'Pakokku', count: 8, diseases: ['Blast', 'Rice Thrips'], severityMin: 44, severityMax: 72, spread: 0.16 },
  { township: 'Sittwe', count: 12, diseases: ['Tungro', 'Bacterial Leaf Blight', 'Leaf Scald'], severityMin: 54, severityMax: 86, spread: 0.18 },
  { township: 'Taunggyi', count: 5, diseases: ['Brown Spot'], severityMin: 30, severityMax: 55, spread: 0.16 },
  { township: 'Lashio', count: 4, diseases: ['Rice Hispa'], severityMin: 28, severityMax: 52, spread: 0.16 },
  { township: 'Hpa-An', count: 6, diseases: ['Sheath Blight', 'Rice Caseworm'], severityMin: 36, severityMax: 64, spread: 0.16 },
  { township: 'Myitkyina', count: 5, diseases: ['Brown Spot', 'Rice Armyworm'], severityMin: 28, severityMax: 54, spread: 0.2 },
  { township: 'Dawei', count: 2, diseases: ['Leaf Smut'], severityMin: 22, severityMax: 40, spread: 0.12 },
  { township: 'Loikaw', count: 2, diseases: ['Brown Spot'], severityMin: 20, severityMax: 38, spread: 0.12 },
  { township: 'Hakha', count: 1, diseases: ['Rice Hispa'], severityMin: 18, severityMax: 32, spread: 0.1 },
];

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function yangonYmd(d: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yangon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function riskFromCount(count: number) {
  if (count >= 20) return 'critical';
  if (count >= 10) return 'high';
  if (count >= 3) return 'medium';
  if (count > 0) return 'low';
  return 'none';
}

function pickDayOffset(rand: () => number) {
  const weights = [1.45, 1.3, 1.15, 1.0, 0.85, 0.7, 0.55];
  const total = weights.reduce((s, w) => s + w, 0);
  let x = rand() * total;
  for (let i = 0; i < weights.length; i += 1) {
    x -= weights[i]!;
    if (x <= 0) return i;
  }
  return 0;
}

let cachedPool: DemoDetection[] | null = null;

function demoPool(): DemoDetection[] {
  if (cachedPool) return cachedPool;
  const rand = mulberry32(20260816);
  const now = Date.now();
  const out: DemoDetection[] = [];

  for (const cluster of CLUSTERS) {
    const town = DEMO_TOWNSHIPS[cluster.township];
    if (!town) continue;
    for (let i = 0; i < cluster.count; i += 1) {
      const dayOffset = pickDayOffset(rand);
      const hour = Math.floor(rand() * 16) + 5;
      const minute = Math.floor(rand() * 60);
      const ts = new Date(now);
      ts.setDate(ts.getDate() - dayOffset);
      ts.setHours(hour, minute, Math.floor(rand() * 60), 0);

      const ang = rand() * Math.PI * 2;
      const dist = rand() * cluster.spread;
      const disease = cluster.diseases[Math.floor(rand() * cluster.diseases.length)]!;
      const severity = Math.round(
        cluster.severityMin + rand() * (cluster.severityMax - cluster.severityMin)
      );

      out.push({
        lat: town.lat + Math.sin(ang) * dist * 0.85,
        lng: town.lng + Math.cos(ang) * dist,
        township: cluster.township,
        region: town.region,
        disease,
        severity,
        timestamp: ts.toISOString(),
      });
    }
  }

  out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  cachedPool = out;
  return out;
}

function inRange(d: DemoDetection, range: DemoRange, day?: string) {
  const ts = new Date(d.timestamp).getTime();
  const now = Date.now();
  if (range === 'today') {
    return yangonYmd(new Date(d.timestamp)) === (day || yangonYmd(new Date()));
  }
  if (range === '24h') return now - ts <= 24 * 60 * 60 * 1000;
  return true;
}

export function buildDemoHeatmap(opts: {
  range: DemoRange;
  day?: string;
  disease?: string;
}): DemoHeatmapPayload {
  const disease = opts.disease && opts.disease !== 'All' ? opts.disease : '';
  const detections = demoPool().filter((d) => {
    if (!inRange(d, opts.range, opts.day)) return false;
    if (disease && d.disease !== disease) return false;
    return true;
  });

  const byTown = new Map<string, number>();
  const byTownDisease = new Map<string, number>();
  const byDisease = new Map<string, number>();

  for (const d of detections) {
    byTown.set(d.township, (byTown.get(d.township) || 0) + 1);
    const key = `${d.township}||${d.disease}`;
    byTownDisease.set(key, (byTownDisease.get(key) || 0) + 1);
    byDisease.set(d.disease, (byDisease.get(d.disease) || 0) + 1);
  }

  const features: DemoFeature[] = [...byTown.entries()].map(([name, outbreakCount]) => ({
    properties: {
      name,
      region: DEMO_TOWNSHIPS[name]?.region || name,
      outbreakCount,
      riskLevel: riskFromCount(outbreakCount),
    },
  }));

  const aggregates: DemoAggregate[] = [...byTownDisease.entries()].map(([key, count]) => {
    const [township, dName] = key.split('||');
    return { _id: { township, disease: dName }, count };
  });

  const recent: DemoRecent[] = detections.slice(0, 16).map((d) => ({
    township: d.township,
    disease: d.disease,
    severity: d.severity,
    timestamp: d.timestamp,
  }));

  return {
    features,
    aggregates,
    recent,
    detections,
    totals: {
      detections: detections.length,
      townships: byTown.size,
      diseases: byDisease.size,
      byDisease: [...byDisease.entries()]
        .map(([dName, count]) => ({ disease: dName, count }))
        .sort((a, b) => b.count - a.count),
    },
  };
}

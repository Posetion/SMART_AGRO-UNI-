const KEY = 'smart_agro_preferred_township';

export type PreferredTownship = {
  nameEn: string;
  nameMy?: string;
  region?: string;
  lat?: number;
  lng?: number;
};

export function readPreferredTownship(): PreferredTownship | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PreferredTownship;
    if (!parsed?.nameEn?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePreferredTownship(next: PreferredTownship) {
  const nameEn = next.nameEn.trim();
  if (!nameEn) return;
  const current = readPreferredTownship();
  localStorage.setItem(
    KEY,
    JSON.stringify({
      nameEn,
      nameMy: next.nameMy?.trim() || current?.nameMy,
      region: next.region?.trim() || current?.region,
      lat: typeof next.lat === 'number' ? next.lat : current?.lat,
      lng: typeof next.lng === 'number' ? next.lng : current?.lng,
    })
  );
}

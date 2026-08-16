import type { Lang } from '../context/LanguageContext';
import { CROP_NAME_MY, type CropType } from '../data/diseaseNames';
import { MYANMAR_REGION_META } from '../data/myanmarStatesGeo';

/** Crop label with Myanmar name when available. Myanmar first for bilingual. */
export function formatCropLabel(crop?: string | null, lang: Lang = 'en'): string {
  if (!crop?.trim()) return '—';
  const raw = crop.trim();
  const my = CROP_NAME_MY[raw as CropType];
  if (!my) return raw;
  if (lang === 'my') return `${my} (${raw})`;
  return `${my} · ${raw}`;
}

/** Region / state name → Myanmar when available. */
export function formatRegionLabel(region?: string | null, lang: Lang = 'en'): string {
  if (!region?.trim()) return lang === 'my' ? 'မြန်မာ' : 'Myanmar';
  if (lang !== 'my') return region;
  const lower = region.trim().toLowerCase();
  if (lower === 'myanmar' || lower === 'burma') return 'မြန်မာ';
  const hit = MYANMAR_REGION_META.find(
    (r) =>
      r.name.toLowerCase() === lower ||
      r.id === lower ||
      lower.startsWith(r.name.toLowerCase()) ||
      lower.includes(r.name.toLowerCase())
  );
  return hit?.nameMy || region;
}

export function formatTownshipLabel(
  nameEn?: string | null,
  nameMy?: string | null,
  lang: Lang = 'en'
): string {
  const en = (nameEn || '').trim();
  const my = (nameMy || '').trim();
  if (
    en === 'My location' ||
    en === 'ကျွန်ုပ်၏ တည်နေရာ' ||
    my === 'My location' ||
    my === 'ကျွန်ုပ်၏ တည်နေရာ'
  ) {
    return lang === 'my' ? 'ကျွန်ုပ်၏ တည်နေရာ' : 'My location';
  }
  if (lang === 'my' && my) return my;
  return en || my || '—';
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CROP_TYPES,
  CROP_NAME_MY,
  CROP_DISEASES,
  CROP_PESTS,
  ALL_DETECT_LABELS,
  DISEASE_NAME_MY,
  RICE_DISEASES,
  RICE_PESTS,
} from '../src/config/diseases.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const j = (v: unknown) => JSON.stringify(v, null, 2);

const myEntries = Object.entries(DISEASE_NAME_MY)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join('\n');
const cropMy = Object.entries(CROP_NAME_MY)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join('\n');
const cropDiseases = Object.entries(CROP_DISEASES)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${j(v)} as const,`)
  .join('\n');
const cropPests = Object.entries(CROP_PESTS)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${j(v)} as const,`)
  .join('\n');

const out = `/** Keep in sync with server/src/config/diseases.ts */
export const CROP_TYPES = ${j([...CROP_TYPES])} as const;
export type CropType = (typeof CROP_TYPES)[number];

export const CROP_NAME_MY: Record<CropType, string> = {
${cropMy}
};

export function cropNameMy(crop?: string) {
  if (!crop) return '';
  return CROP_NAME_MY[crop as CropType] || crop;
}

export const RICE_DISEASES = ${j([...RICE_DISEASES])} as const;
export const RICE_PESTS = ${j([...RICE_PESTS])} as const;

export const CROP_DISEASES: Record<CropType, readonly string[]> = {
${cropDiseases}
};

export const CROP_PESTS: Record<CropType, readonly string[]> = {
${cropPests}
};

export const DISEASE_NAME_MY: Record<string, string> = {
${myEntries}
};

export function diseaseNameMy(disease?: string) {
  if (!disease) return '';
  return DISEASE_NAME_MY[disease] || disease;
}

export function formatDiseaseLabel(disease?: string, lang: 'en' | 'my' = 'en') {
  if (!disease) return '';
  const my = diseaseNameMy(disease);
  if (lang === 'my') {
    return my === disease ? disease : \`\${my} (\${disease})\`;
  }
  return my && my !== disease ? \`\${disease} · \${my}\` : disease;
}

export function labelsForCrop(crop: string): string[] {
  const key = crop as CropType;
  if (!CROP_DISEASES[key]) return [...ALL_DETECT_LABELS];
  return [...CROP_DISEASES[key], ...CROP_PESTS[key], 'Healthy'];
}

/** Full AI detect allowlist (diseases + pests + Healthy). Keep in sync with server. */
export const ALL_DETECT_LABELS = ${j([...ALL_DETECT_LABELS])} as const;

export const ALL_PESTS = [...new Set(Object.values(CROP_PESTS).flat())] as string[];
`;

const target = path.resolve(__dirname, '../../client/src/data/diseaseNames.ts');
fs.writeFileSync(target, out.replace("if (!disease) return '';", "if (!disease) return '—';"));
console.log('wrote', target);

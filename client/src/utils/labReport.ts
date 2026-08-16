import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { DiseaseGuide } from '../data/diseaseGuides';
import {
  CROP_NAME_MY,
  diseaseNameMy,
  type CropType,
} from '../data/diseaseNames';

export type LabReportInput = {
  reportId: string;
  /** English crop key (e.g. Rice) or already-formatted; Myanmar resolved in report. */
  cropType?: string;
  /** English disease/pest key preferred for lookup. */
  disease?: string;
  severityLabelEn: string;
  severityLabelMy: string;
  severityIndex?: number;
  confidencePct?: number | null;
  /** Prefer raw English disease keys; report formats Myanmar-first. */
  probabilities?: Array<{ disease: string; pct: number }>;
  location?: string;
  analyzedAt?: string;
  verified?: boolean;
  diseaseCorrected?: boolean;
  aiDetectedDisease?: string;
  expertBooks?: string;
  expertDrugs?: string;
  expertSuggestion?: string;
  treatmentProtocol?: string;
  guide: DiseaseGuide | null;
  treatmentSteps: string[];
};

const ACCENT = '0F766E';
const LINE = 'CBD5E1';
const MUTED_BG = 'F0FDFA';
const WARN_BG = 'FFF7ED';

function border() {
  const b = { style: BorderStyle.SINGLE, size: 8, color: LINE };
  return { top: b, bottom: b, left: b, right: b };
}

function cell(
  text: string,
  opts?: {
    bold?: boolean;
    fill?: string;
    width?: number;
    color?: string;
    center?: boolean;
    fontSize?: number;
  }
) {
  return new TableCell({
    borders: border(),
    width: { size: opts?.width ?? 2500, type: WidthType.DXA },
    shading: opts?.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    children: [
      new Paragraph({
        alignment: opts?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            color: opts?.color || '0F172A',
            size: opts?.fontSize ?? 20,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

/** Myanmar first, then English. */
function biLabel(my: string, en: string) {
  return `${my} / ${en}`;
}

function heading(my: string, en: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text: `${my} / ${en}`,
        bold: true,
        color: ACCENT,
        size: 24,
        font: 'Calibri',
      }),
    ],
  });
}

function bulletMy(text: string) {
  return new Paragraph({
    spacing: { after: 20 },
    indent: { left: 240 },
    children: [
      new TextRun({ text: `• ${text}`, size: 20, font: 'Calibri', color: '0F172A', bold: true }),
    ],
  });
}

function bulletEn(text: string) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: text, size: 19, font: 'Calibri', color: '334155' }),
    ],
  });
}

function numberedMy(i: number, text: string) {
  return new Paragraph({
    spacing: { after: 20 },
    indent: { left: 180 },
    children: [
      new TextRun({
        text: `${i}. ${text}`,
        size: 20,
        font: 'Calibri',
        color: '0F172A',
        bold: true,
      }),
    ],
  });
}

function numberedEn(text: string) {
  return new Paragraph({
    spacing: { after: 90 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: text, size: 19, font: 'Calibri', color: '334155' }),
    ],
  });
}

/** Pair MY/EN lines — Myanmar first. */
function pushPairedBullets(
  children: Array<Paragraph | Table>,
  en: string[],
  my: string[]
) {
  const n = Math.max(en.length, my.length);
  for (let i = 0; i < n; i++) {
    if (my[i]) children.push(bulletMy(my[i]));
    else if (en[i]) children.push(bulletMy(en[i]));
    if (en[i] && my[i]) children.push(bulletEn(en[i]));
  }
}

function pushPairedNumbered(
  children: Array<Paragraph | Table>,
  en: string[],
  my: string[]
) {
  const n = Math.max(en.length, my.length);
  for (let i = 0; i < n; i++) {
    if (my[i]) children.push(numberedMy(i + 1, my[i]));
    else if (en[i]) children.push(numberedMy(i + 1, en[i]));
    if (en[i] && my[i]) children.push(numberedEn(en[i]));
  }
}

function resolveCropLabel(crop?: string): { en: string; my: string; display: string } {
  const raw = (crop || '').trim() || '—';
  // Strip prior bilingual formatting if present
  const enMatch = raw.match(/\(([^)]+)\)\s*$/);
  const en =
    enMatch && CROP_NAME_MY[enMatch[1] as CropType]
      ? enMatch[1]
      : CROP_NAME_MY[raw as CropType]
        ? raw
        : raw.includes(' · ')
          ? raw.split(' · ').pop()!.trim()
          : raw;
  const my = CROP_NAME_MY[en as CropType] || raw;
  const display = my && my !== en ? `${my} (${en})` : en;
  return { en, my: my || en, display };
}

function resolveDiseaseNames(disease?: string, guide?: DiseaseGuide | null) {
  const raw = (disease || guide?.nameEn || '').trim();
  // If already bilingual "မြန်မာ (English)", extract English key
  const paren = raw.match(/^(.+?)\s*[·(]\s*([^)·]+)\s*\)?\s*$/);
  let enKey = raw;
  if (paren) {
    const a = paren[1].trim();
    const b = paren[2].trim();
    // Prefer the English-looking side as key
    if (/^[A-Za-z0-9]/.test(b) && !/^[A-Za-z0-9]/.test(a)) enKey = b;
    else if (/^[A-Za-z0-9]/.test(a)) enKey = a;
  }
  const en = guide?.nameEn || enKey || '—';
  const fromCatalog = diseaseNameMy(enKey);
  const my =
    (fromCatalog && fromCatalog !== enKey ? fromCatalog : '') ||
    guide?.nameMy ||
    fromCatalog ||
    en;
  return { en, my, display: my && my !== en ? `${my} (${en})` : en };
}

export async function buildLabReportDocx(input: LabReportInput): Promise<Blob> {
  const guide = input.guide;
  const { en: diseaseEn, my: diseaseMy, display: diseaseDisplay } = resolveDiseaseNames(
    input.disease,
    guide
  );
  const crop = resolveCropLabel(input.cropType);
  const conf =
    input.confidencePct != null && !Number.isNaN(input.confidencePct)
      ? `${input.confidencePct}%`
      : '—';
  const statusEn = input.verified
    ? input.diseaseCorrected
      ? 'Expert verified (corrected)'
      : 'Expert verified'
    : 'AI result';
  const statusMy = input.verified
    ? input.diseaseCorrected
      ? 'ကျွမ်းကျင်သူ အတည်ပြုပြီး (ပြင်ဆင်ထား)'
      : 'ကျွမ်းကျင်သူ အတည်ပြုပြီး'
    : 'AI ရလဒ်';

  const metaTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 2340, 2340, 2340],
    rows: [
      new TableRow({
        children: [
          cell(biLabel('နမူနာ', 'Sample ID'), { bold: true, fill: MUTED_BG, width: 2340, fontSize: 16 }),
          cell(input.reportId, { width: 2340, bold: true, color: ACCENT }),
          cell(biLabel('စစ်ဆေးချိန်', 'Analyzed'), { bold: true, fill: MUTED_BG, width: 2340, fontSize: 16 }),
          cell(input.analyzedAt || '—', { width: 2340 }),
        ],
      }),
      new TableRow({
        children: [
          cell(biLabel('သီးနှံ', 'Crop'), { bold: true, fill: MUTED_BG, width: 2340, fontSize: 16 }),
          cell(crop.display, { width: 2340, bold: true }),
          cell(biLabel('တည်နေရာ', 'Location'), { bold: true, fill: MUTED_BG, width: 2340, fontSize: 16 }),
          cell(input.location || '—', { width: 2340 }),
        ],
      }),
      new TableRow({
        children: [
          cell(biLabel('ရောဂါ / ပိုး (မြန်မာ)', 'Disease (MY)'), {
            bold: true,
            fill: MUTED_BG,
            width: 2340,
            fontSize: 16,
          }),
          cell(diseaseMy, { width: 2340, bold: true, color: ACCENT }),
          cell(biLabel('ရောဂါ / ပိုး (အင်္ဂလိပ်)', 'Disease (EN)'), {
            bold: true,
            fill: MUTED_BG,
            width: 2340,
            fontSize: 16,
          }),
          cell(diseaseEn, { width: 2340, bold: true }),
        ],
      }),
    ],
  });

  const organismTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      new TableRow({
        children: [
          cell(biLabel('ဖြစ်စေသော သက်ရှိ', 'Causal organism'), {
            bold: true,
            fill: MUTED_BG,
            width: 3120,
            fontSize: 16,
          }),
          cell(guide?.organism || '—', { width: 6240 }),
        ],
      }),
      new TableRow({
        children: [
          cell(biLabel('အခြေအနေ', 'Status'), {
            bold: true,
            fill: MUTED_BG,
            width: 3120,
            fontSize: 16,
          }),
          cell(`${statusMy} / ${statusEn}`, { width: 6240 }),
        ],
      }),
    ],
  });

  const highlightTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 3120, 3120],
    rows: [
      new TableRow({
        children: [
          cell(biLabel('ယုံကြည်မှု', 'Confidence'), {
            bold: true,
            fill: MUTED_BG,
            width: 3120,
            center: true,
            fontSize: 16,
          }),
          cell(biLabel('ပြင်းထန်မှု', 'Severity'), {
            bold: true,
            fill: WARN_BG,
            width: 3120,
            center: true,
            fontSize: 16,
          }),
          cell(biLabel('အညွှန်းကိန်း', 'Severity index'), {
            bold: true,
            fill: MUTED_BG,
            width: 3120,
            center: true,
            fontSize: 16,
          }),
        ],
      }),
      new TableRow({
        children: [
          cell(conf, { bold: true, width: 3120, center: true, color: ACCENT, fontSize: 32 }),
          cell(`${input.severityLabelMy} / ${input.severityLabelEn}`, {
            bold: true,
            width: 3120,
            center: true,
            color: 'B45309',
            fontSize: 22,
          }),
          cell(input.severityIndex != null ? String(input.severityIndex) : '—', {
            bold: true,
            width: 3120,
            center: true,
            fontSize: 32,
          }),
        ],
      }),
    ],
  });

  const children: Array<Paragraph | Table> = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: 'ဓာတ်ခွဲခန်း ရောဂါစစ်ဆေးမှု အစီရင်ခံစာ',
          bold: true,
          size: 32,
          color: ACCENT,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: 'Smart Agro Laboratory Disease Report',
          bold: true,
          size: 26,
          color: ACCENT,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'အရွက်နမူနာ AI + စိုက်ခင်း ကုသမှု လမ်းညွှန် / Leaf sample AI analysis + field treatment guide',
          size: 18,
          color: '475569',
          font: 'Calibri',
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `ဓာတ်ခွဲ အစီရင်ခံစာ · LAB REPORT · ${input.reportId}`,
          bold: true,
          size: 18,
          color: ACCENT,
          font: 'Calibri',
        }),
      ],
    }),
    metaTable,
    new Paragraph({ spacing: { before: 120, after: 80 }, children: [] }),
    organismTable,
    new Paragraph({ spacing: { before: 160, after: 80 }, children: [] }),
    highlightTable,
  ];

  if (input.probabilities?.length) {
    children.push(heading('ယုံကြည်မှု ခွဲခြမ်းစိတ်ဖြာချက်', 'Confidence breakdown'));
    children.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6560, 2800],
        rows: [
          new TableRow({
            children: [
              cell(biLabel('အမျိုးအစား / ရောဂါ', 'Class / Disease'), {
                bold: true,
                fill: MUTED_BG,
                width: 6560,
                fontSize: 16,
              }),
              cell('%', { bold: true, fill: MUTED_BG, width: 2800, center: true, fontSize: 16 }),
            ],
          }),
          ...input.probabilities.map((p) => {
            const label = resolveDiseaseNames(p.disease, null).display;
            return new TableRow({
              children: [
                cell(label, { width: 6560 }),
                cell(`${p.pct}%`, { width: 2800, center: true, bold: true, color: ACCENT }),
              ],
            });
          }),
        ],
      })
    );
  }

  const hasExpertBlock = Boolean(
    input.verified &&
      (input.diseaseCorrected ||
        input.expertBooks ||
        input.expertDrugs ||
        input.expertSuggestion ||
        input.treatmentProtocol)
  );
  if (hasExpertBlock) {
    children.push(heading('ကျွမ်းကျင်သူ စိစစ်ချက်', 'Expert review'));
    const expertRows: TableRow[] = [];
    if (input.diseaseCorrected && input.aiDetectedDisease) {
      const ai = resolveDiseaseNames(input.aiDetectedDisease, null);
      expertRows.push(
        new TableRow({
          children: [
            cell(biLabel('AI မူလ', 'AI original'), {
              bold: true,
              fill: MUTED_BG,
              width: 3120,
              fontSize: 16,
            }),
            cell(ai.display, { width: 6240 }),
          ],
        }),
        new TableRow({
          children: [
            cell(biLabel('ကျွမ်းကျင်သူ ရောဂါ/ပိုး', 'Expert diagnosis'), {
              bold: true,
              fill: MUTED_BG,
              width: 3120,
              fontSize: 16,
            }),
            cell(diseaseDisplay, { width: 6240, bold: true, color: ACCENT }),
          ],
        })
      );
    }
    if (input.expertDrugs) {
      expertRows.push(
        new TableRow({
          children: [
            cell(biLabel('အကြံပြု ဆေးများ', 'Recommended drugs'), {
              bold: true,
              fill: MUTED_BG,
              width: 3120,
              fontSize: 16,
            }),
            cell(input.expertDrugs, { width: 6240 }),
          ],
        })
      );
    }
    if (input.expertBooks) {
      expertRows.push(
        new TableRow({
          children: [
            cell(biLabel('စာအုပ် / လမ်းညွှန်', 'Books / guides'), {
              bold: true,
              fill: MUTED_BG,
              width: 3120,
              fontSize: 16,
            }),
            cell(input.expertBooks, { width: 6240 }),
          ],
        })
      );
    }
    if (input.expertSuggestion) {
      expertRows.push(
        new TableRow({
          children: [
            cell(biLabel('ကျွမ်းကျင်သူ မှတ်ချက်', 'Expert notes'), {
              bold: true,
              fill: MUTED_BG,
              width: 3120,
              fontSize: 16,
            }),
            cell(input.expertSuggestion, { width: 6240 }),
          ],
        })
      );
    }
    if (input.treatmentProtocol) {
      expertRows.push(
        new TableRow({
          children: [
            cell(biLabel('ကုသနည်း', 'Treatment protocol'), {
              bold: true,
              fill: MUTED_BG,
              width: 3120,
              fontSize: 16,
            }),
            cell(input.treatmentProtocol, { width: 6240 }),
          ],
        })
      );
    }
    if (expertRows.length) {
      children.push(
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 6240],
          rows: expertRows,
        })
      );
    }
  }

  const hasSymptoms =
    (guide?.symptomsEn?.length ?? 0) > 0 || (guide?.symptomsMy?.length ?? 0) > 0;
  if (hasSymptoms) {
    children.push(heading('ရောဂါလက္ခဏာများ', 'Symptoms'));
    pushPairedBullets(children, guide?.symptomsEn ?? [], guide?.symptomsMy ?? []);
  }

  const controlsEn = guide?.controlsEn?.length ? guide.controlsEn : input.treatmentSteps;
  const controlsMy = guide?.controlsMy?.length
    ? guide.controlsMy
    : !guide?.controlsEn?.length
      ? input.treatmentSteps
      : [];
  if (controlsEn.length || controlsMy.length) {
    children.push(heading('ကာကွယ်နှိမ်နင်းနည်းများ', 'Control measures'));
    pushPairedNumbered(children, controlsEn, controlsMy);
  }

  const chemLines =
    guide?.chemicalsMy?.length ? guide.chemicalsMy : guide?.chemicals ?? [];
  if (chemLines.length) {
    children.push(heading('အကြံပြု ဆေးများ', 'Recommended chemicals'));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: chemLines.join('  ·  '),
            bold: true,
            size: 20,
            color: '115E59',
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 280 },
      border: {
        top: { style: BorderStyle.DASHED, size: 6, color: LINE, space: 8 },
      },
      children: [
        new TextRun({
          text: 'မှတ်ချက် / Note: ',
          bold: true,
          size: 18,
          color: '475569',
          font: 'Calibri',
        }),
        new TextRun({
          text:
            'ဤအစီရင်ခံစာသည် စိုက်ခင်းအကြံပြုချက်အတွက်ဖြစ်သည်။ ဆေးသုံးစွဲမီ ဒေသကျွမ်းကျင်သူနှင့် တိုင်ပင်ပါ။ / This report is for field guidance. Confirm chemical use with a local agronomist before application.',
          size: 18,
          color: '475569',
          font: 'Calibri',
        }),
      ],
    })
  );

  const doc = new Document({
    creator: 'Smart Agro',
    title: `Smart Agro Lab Report ${input.reportId}`,
    description: 'Myanmar-first bilingual laboratory disease detection report',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function downloadLabReportDocx(input: LabReportInput, filename: string) {
  const blob = await buildLabReportDocx(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

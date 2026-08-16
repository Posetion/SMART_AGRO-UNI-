import { fieldTreatmentMy } from '../config/fieldTreatments.js';
import {
  ALL_DETECT_LABELS,
  CROP_TYPES,
  cropNameMy,
  cropProblemsPromptBlock,
  diseaseNameMy,
  type CropType,
} from '../config/diseases.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export interface DetectResult {
  cropType: CropType | '';
  disease: string;
  diseaseMy?: string;
  severityIndex: number;
  probabilities: Array<{ disease: string; diseaseMy?: string; probability: number }>;
  treatmentProtocol: string;
  quality?: { ok: boolean; issues?: string[]; leafColorRatio?: number };
  confidence?: number;
  model?: string;
}

export interface PredictResult {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Outbreak_Imminent';
  forecastDays: number;
  confidence: number;
}

export interface ChatResult {
  reply: string;
}

/** Fallback protocols aligned with Disease.docx field guide. */
const TREATMENT_MY: Record<string, string> = {
  Blast:
    'ရောဂါခံနိုင်သော မျိုးစိုက်ပါ။ ရောဂါပင်ကြွင်း မီးရှို့ပါ။ နွေစပါးတွင် ရေအမြဲရှိအောင် ထိန်းပါ။ ပိုတက်ရှ် မြေဩဇာ ထည့်ပါ။ မျိုးစေ့ကို မှိုသတ်ဆေးဖြင့် လူးနယ်ပါ။ ဆေး: Isoprothiolane, Tricyclazole, Thiophanate-methyl, Prochloraz။',
  'Brown Spot':
    'ရောဂါကင်းမျိုးစေ့ ရွေးပါ။ ပင်ကြွင်း မီးရှို့ပါ။ မြေဩဇာ မျှတစွာ ထည့်ပြီး နိုက်ထရိုဂျင်နှင့်အတူ ပိုတက်ရှ်/တီစူပါ တွဲသုံးပါ။ ဆေး: Propiconazole, Thiophanate-methyl, Difenoconazole။',
  'Bacterial Leaf Blight':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ရောဂါကျခင်းမှ မျိုးစေ့ မပြန်သုံးပါနှင့်။ စိတ်စိတ်မစိုက်ရ။ ယူရီးယား မလွန်ပါနှင့်၊ ပိုတက်ရှ် မဖြစ်မနေ ထည့်ပါ။ ဆေး: Kasugamycin, Bismerthiazol, Copper Oxychloride, Oxolinic Acid။',
  'Sheath Blight':
    'စိတ်လွန်းစွာ မစိုက်ပါနှင့်။ နိုက်ထရိုဂျင် မလွန်အောင် ခွဲထည့်ပါ။ ပဲမျိုးနှင့် သီးလှည့်စိုက်ပါ။ ပင်ကြွင်း ဖယ်ရှားပါ။ ဆေး: Azoxystrobin, Hexaconazole, Propiconazole, Validamycin, Thiophanate-methyl။',
  'Leaf Scald': 'ရေသွင်းရေထုတ် ထိန်းညှိပြီး ရောဂါခံနိုင်သော မျိုးရွေးချယ်ပါ။ လိုအပ်ပါက မှိုသတ်ဆေး သုံးပါ။',
  'Leaf Smut': 'သန့်ရှင်းသော မျိုးစေ့ အသုံးပြုပြီး ကွင်းသန့်ရှင်းရေး လုပ်ပါ။',
  Tungro: 'စပါးရွက်စုပ်ပိုး ထိန်းချုပ်ရေး လုပ်ပြီး ရောဂါခံနိုင်သော မျိုးများ ရွေးချယ်ပါ။ ရောဂါကျပင် ဖယ်ရှားပါ။',
  'False Smut':
    'ရောဂါကျခင်းမှ မျိုးစေ့ မသုံးပါနှင့်။ မျိုးစေ့ကို မှိုသတ်ဆေးဖြင့် လူးနယ်ပါ။ အနှံမထွက်မီ ဆေးဖျန်းပါ။ ဆေး: Propiconazole, Azoxystrobin, Benomyl, Carbendazim။',
  'Narrow Brown Spot':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ရောဂါကင်းမျိုးစေ့ သုံးပါ။ အာဟာရပြည့်မြေဩဇာ ပေးပါ။ ရေငတ်မထားပါနှင့်။ ဆေး: Propiconazole, Tricyclazole, Thiophanate-methyl+Thiram, Chlorothalonil, Carbendazim။',
  'Bacterial Leaf Streak':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ရောဂါကျမျိုးစေ့ မပြန်သုံးပါနှင့်။ စိတ်စိတ်မစိုက်ရ။ ယူရီးယား မလွန်အောင် ခွဲထည့်ပြီး ပိုတက်ရှ် ထည့်ပါ။ ဆေး: Kasugamycin, Bismerthiazol, Copper Oxychloride, Oxolinic Acid။',
  'Sheath Rot':
    'ရောဂါကင်းမျိုးစေ့ သုံးပါ။ ရောဂါရအနှံ/ရွက်ဖုံး မီးရှို့ပါ။ မြေဩဇာ မျှတစွာ၊ နိုက်ထရိုဂျင် မလွန်၊ ပိုတက်ရှ် ကဲ၍သုံးပါ။ ဆေး: Propiconazole, Difenoconazole, Chlorothalonil, Thiophanate-methyl, Benomyl။',
  Bakanae:
    'စိုက်ခင်းသန့်ရှင်းရေး လုပ်ပါ။ မစိုက်မီ မျိုးစေ့ကို မှိုသတ်ဆေးဖြင့် လူးနယ်/စိမ်ပါ။ ဆေး: Propiconazole, Benomyl, Carbendazim, Mancozeb, Hexaconazole။',
  'Stem Rot':
    'ယိုင်လဲမှုနည်းမျိုး သုံးပါ။ ကောက်ရိုး/ပင်ကြွင်း မီးရှို့ပါ။ ရေမသွင်းမီ မြေလှပ်ပါ။ နိုက်ထရိုဂျင်/ဖော့စဖောရပ် မလွန်ပါနှင့်။ ဆေး: Propiconazole, Chlorothalonil, Thiophanate-methyl, Benomyl။',
  'Yellow Stem Borer':
    'ခံနိုင်ရည်ရှိမျိုး စိုက်ပါ။ ပင်သေ/နှံဖြူပင် ဖယ်ရှားပါ။ အလင်းထောင်ချောက် သုံးပါ။ လိုအပ်မှ ပိုးသတ်ဆေး (Cartap, Chlorantraniliprole) သုံးပါ။',
  'Pink Stem Borer':
    'ပင်သေ/နှံဖြူပင် ဖယ်ပါ။ ကောက်ရိုးပုံများ မထားပါနှင့်။ အလင်းထောင်ချောက် စောင့်ကြည့်ပါ။ လိုအပ်မှ Cartap / Chlorantraniliprole သုံးပါ။',
  'Brown Planthopper':
    'နိုက်ထရိုဂျင် မလွန်ပါနှင့်။ ရေခင်းကို တစ်ခါတရံ ခြောက်အောင် ထားပါ။ သဘာဝရန်သူများ ထိန်းသိမ်းပါ။ ပြင်းထန်မှ Buprofezin / Pymetrozine သုံးပါ။',
  'Whitebacked Planthopper':
    'နိုက်ထရိုဂျင် မလွန်ပါနှင့်။ ရေသွင်းရေထုတ် လှည့်ပါ။ ပင်ခြေကို စစ်ဆေးပါ။ ပြင်းထန်မှ Buprofezin / Pymetrozine သုံးပါ။',
  'Green Leafhopper':
    'တန်ဂရိုခံနိုင်မျိုး စိုက်ပါ။ ပေါင်းရှင်းပြီး ရွက်စိမ်းခုန်ပိုးကို စောစီးစွာ စောင့်ကြည့်ပါ။ လိုအပ်မှ imidacloprid / buprofezin အုပ်စုကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Rice Leaf Folder':
    'ပေါင်းရှင်းပြီး အပင်စိတ်လွန်းခြင်း ရှောင်ပါ။ ပိုးလောက်များပါ ရွက်လိပ်များကို ဖယ်ပါ။ လိုအပ်မှ Cartap / Chlorantraniliprole သုံးပါ။',
  'Rice Caseworm':
    'ရေနက်နက် ကြာကြာ မထားပါနှင့်။ အရွက်အိတ်/ပိုးလောက်များကို ဖယ်ပါ။ လိုအပ်မှ Cartap / Chlorantraniliprole သုံးပါ။',
  'Rice Gall Midge':
    'ခံနိုင်ရည်ရှိမျိုး ရွေးပါ။ စိုက်ချိန် မှန်မှန် စိုက်ပါ။ ရောဂါ/ပိုးကျပင် ဖယ်ပါ။ လိုအပ်မှ Carbosulfan / Fipronil အုပ်စုကို စနစ်တကျ သုံးပါ။',
  'Rice Hispa':
    'ပေါင်းမြက် ရှင်းပါ။ အရွက်ပေါ် အဖြူအစင်း/အပေါက်များ စောစီးစွာ စောင့်ကြည့်ပါ။ လိုအပ်မှ Malathion / Lambda-cyhalothrin ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Whorl Maggot':
    'ပင်ထိပ်ရွက် စုတ်ပြတ်/အပေါက်များကို စောင့်ကြည့်ပါ။ ရေစီမံခန့်ခွဲမှု မှန်မှန်လုပ်ပါ။ လိုအပ်မှ Cartap / Fipronil သုံးပါ။',
  'Rice Armyworm':
    'ညဘက် စိုက်ခင်း စစ်ဆေးပါ။ ပိုးလောက်အစုအဝေးကို လက်ဖြင့် ဖယ်ပါ။ လိုအပ်မှ Chlorantraniliprole / Emamectin သုံးပါ။',
  'Rice Bug':
    'အနှံနို့ရည်အဆင့်တွင် စောင့်ကြည့်ပါ။ ပေါင်းမြက်ရှင်းပါ။ လိုအပ်မှ Ethofenprox / Malathion ကို တံဆိပ်အတိုင်း သုံးပါ။',
  'Rice Thrips':
    'ပျိုးပင်/အပင်ငယ်တွင် ရွက်လိပ်ဝါခြင်းကို စောင့်ကြည့်ပါ။ ရေငတ်မထားပါနှင့်။ လိုအပ်မှ Imidacloprid / Spinosad သုံးပါ။',
  Healthy: 'အပင် ကျန်းမာနေပါသည်။ ပုံမှန် စောင့်ကြည့်ပါ။',
};

const DEFAULT_TREATMENT_MY =
  'ရောဂါ/ပိုးကျပင်များကို ဖယ်ရှားပါ။ ကွင်းသန့်ရှင်းရေး လုပ်ပါ။ ရေနှင့် မြေဩဇာ မျှတစွာ ထိန်းပါ။ လိုအပ်မှ ဒေသခံ စိုက်ပျိုးရေး ကျွမ်းကျင်သူနှင့် တိုင်ပင်ပြီး သင့်တော်သော ဆေးကို တံဆိပ်အတိုင်း သုံးပါ။';

function mockPredict(humidity = 70): PredictResult {
  const riskLevel =
    humidity >= 85 ? 'Outbreak_Imminent' : humidity >= 75 ? 'High' : humidity >= 60 ? 'Medium' : 'Low';
  return { riskLevel, forecastDays: 14, confidence: 0.7 };
}

function mockChat(prompt: string): ChatResult {
  return {
    reply: `မင်္ဂလာပါ။ ဘကြီးပျိုး (BaGyi Pyoe) ဖြစ်ပါတယ်။ သင့်မေးခွန်း: "${prompt.slice(0, 120)}" — သီးနှံ ရောဂါ/ပိုးမွှား၊ ရာသီဥတုနှင့် စိုက်ပျိုးရေး အကြံဉာဏ်များ မေးနိုင်ပါသည်။`,
  };
}

const SUPPORTED_CROPS_LIST = CROP_TYPES.map((c) => `${c} (${cropNameMy(c)})`).join(', ');

const FARM_SYSTEM_PROMPT = `You are ဘကြီးပျိုး (BaGyi Pyoe) — Smart Agro's warm, practical field uncle for Myanmar farmers across many crops. Speak like a trusted village elder who raises seedlings: clear, encouraging, and hands-on.

Supported crops: ${SUPPORTED_CROPS_LIST}

Crop problems (diseases & pests):
${cropProblemsPromptBlock()}

Also advise on:
- Weather-informed irrigation, planting, and disease/pest-pressure for Myanmar townships
- Organic / IPM care, field scouting, and when to seek a local agronomist

How to answer:
1. Reply in the same language the farmer uses (English or Myanmar/Burmese).
2. Be concrete and actionable: short steps, what to check in the field today, and what to do next.
3. When LIVE WEATHER CONTEXT is provided, USE those numbers (temp, humidity, rain, alerts). Cite them briefly. Do not invent local weather.
4. Tie weather to crop risk (e.g. high humidity + rain → fungal disease pressure; stagnant water + high N → planthopper risk).
5. If location/weather is missing or uncertain, say so and suggest the Weather page or Detect page for leaf/pest photos.
6. Prefer integrated pest management. Do not invent pesticide brand names or dosages you are unsure about.
7. Structure longer answers with short bullets. Ask one clarifying question only when it materially changes the advice.
8. Stay concise (usually under ~180 words) unless the farmer asks for detail.`;

export type ChatContext = {
  farmerProfile?: string;
  weatherText?: string;
  images?: Array<{ mimeType: string; base64: string }>;
};

function buildSystemPrompt(context?: ChatContext): string {
  const parts = [FARM_SYSTEM_PROMPT];
  if (context?.farmerProfile?.trim()) {
    parts.push(`\nFARMER PROFILE\n${context.farmerProfile.trim()}`);
  }
  if (context?.weatherText?.trim()) {
    parts.push(
      `\nLIVE WEATHER CONTEXT (authoritative — use these values; do not invent alternatives)\n${context.weatherText.trim()}`
    );
  }
  return parts.join('\n');
}

/** Farmer chatbot via Cursor Agent SDK. Requires CURSOR_API_KEY. */
async function chatWithCursor(
  prompt: string,
  history: Array<{ sender: string; text: string }> = [],
  context?: ChatContext
): Promise<ChatResult> {
  const apiKey = env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError('CURSOR_API_KEY is not configured', 503);
  }

  const prior = history
    .filter((m) => m.text?.trim())
    .slice(-10)
    // Drop the trailing user turn if it duplicates the current prompt
    .filter((m, i, arr) => !(i === arr.length - 1 && m.sender === 'user' && m.text === prompt))
    .map((m) => `${m.sender === 'bot' ? 'Assistant' : 'Farmer'}: ${m.text.trim()}`)
    .join('\n');

  const fullPrompt = [
    buildSystemPrompt(context),
    '',
    prior ? `CONVERSATION SO FAR:\n${prior}` : '',
    '',
    `Farmer's latest message:\n${prompt.trim()}`,
    '',
    'Respond as Smart Agro Assistant only. Plain helpful text — no markdown code fences, no tool logs, no preamble about being an AI.',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const { Agent } = await import('@cursor/sdk');
  const timeoutMs = env.CURSOR_DETECT_TIMEOUT_MS;

  const runChat = async () => {
    const result = await Agent.prompt(fullPrompt, {
      apiKey,
      model: { id: env.CURSOR_MODEL || 'composer-2.5' },
      local: {
        cwd: process.cwd(),
        settingSources: [],
      },
    });

    if (result.status === 'error') {
      throw new AppError(
        (result as { error?: { message?: string } }).error?.message || 'Cursor chat failed',
        503
      );
    }
    const reply = String(result.result || '').trim();
    if (!reply) {
      throw new AppError('Cursor chat returned an empty reply', 503);
    }
    return { reply };
  };

  try {
    return await Promise.race([
      runChat(),
      new Promise<ChatResult>((_, reject) => {
        setTimeout(() => reject(new AppError('Cursor chat timed out', 503)), timeoutMs);
      }),
    ]);
  } catch (err) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : 'Cursor chat failed';
    throw new AppError(message, 503);
  }
}

function geminiApiKeys(): string[] {
  const keys = [
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_2,
    env.GEMINI_API_KEY_3,
    env.GEMINI_API_KEY_4,
    env.GEMINI_API_KEY_5,
    env.GEMINI_API_KEY_6,
    env.GEMINI_API_KEY_7,
    env.GEMINI_API_KEY_8,
    ...(env.GEMINI_API_KEYS || '').split(','),
  ]
    .map((k) => k.trim())
    .filter(Boolean);
  return [...new Set(keys)];
}

function isGeminiQuotaError(err: unknown): boolean {
  if (!(err instanceof AppError)) return false;
  return /quota exceeded|RESOURCE_EXHAUSTED|rate limit|429/i.test(err.message);
}

async function withGeminiKeys<T>(run: (apiKey: string) => Promise<T>): Promise<T> {
  const keys = geminiApiKeys();
  if (!keys.length) throw new AppError('Gemini API key not configured', 503);

  let lastError: unknown;
  for (let i = 0; i < keys.length; i += 1) {
    try {
      return await run(keys[i]);
    } catch (err) {
      lastError = err;
      const hasNext = i < keys.length - 1;
      if (hasNext && isGeminiQuotaError(err)) {
        console.warn(`[gemini] Key ${i + 1}/${keys.length} quota hit — trying next key`);
        continue;
      }
      throw err;
    }
  }
  if (lastError instanceof AppError) throw lastError;
  throw new AppError('Gemini free quota exceeded for now. Please wait a minute and try again.', 503);
}

async function chatWithGemini(
  prompt: string,
  history: Array<{ sender: string; text: string }> = [],
  context?: ChatContext,
  apiKey?: string
): Promise<ChatResult> {
  const key = apiKey?.trim() || geminiApiKeys()[0];
  if (!key) throw new AppError('Gemini API key not configured', 503);

  const contents = history
    .filter((m) => m.text?.trim())
    .map((m) => ({
      role: m.sender === 'bot' ? 'model' : 'user',
      parts: [{ text: m.text }] as Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
    }));

  const imageParts = (context?.images || [])
    .filter((img) => img.base64)
    .slice(0, 8)
    .map((img) => ({
      inlineData: {
        mimeType:
          img.mimeType === 'image/png' || img.mimeType === 'image/webp' || img.mimeType === 'image/gif'
            ? img.mimeType
            : 'image/jpeg',
        data: img.base64,
      },
    }));

  // Ensure the latest user turn is present (history may already include it)
  const last = contents[contents.length - 1];
  if (!last || last.role !== 'user' || last.parts[0]?.text !== prompt) {
    contents.push({ role: 'user', parts: [{ text: prompt }, ...imageParts] });
  } else if (imageParts.length) {
    last.parts.push(...imageParts);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(env.AI_SERVICE_TIMEOUT_MS, 45000));

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(context) }] },
        contents,
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 1400,
          topP: 0.9,
        },
      }),
    });

    const raw = (await res.json()) as {
      error?: { message?: string; status?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    if (!res.ok) {
      const msg = raw.error?.message || `Gemini error (${res.status})`;
      if (res.status === 429 || raw.error?.status === 'RESOURCE_EXHAUSTED') {
        throw new AppError(
          'Gemini free quota exceeded for now. Please wait a minute and try again.',
          503
        );
      }
      throw new AppError(msg, 503);
    }

    const reply = raw.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (!reply) throw new AppError('Gemini returned an empty reply', 503);
    return { reply };
  } finally {
    clearTimeout(timer);
  }
}

async function callAi<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_SERVICE_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.AI_SERVICE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new AppError('AI service error', 503);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('AI service unavailable', 503);
  } finally {
    clearTimeout(timer);
  }
}

const DETECT_ALLOWED_DISEASES = [...ALL_DETECT_LABELS] as const;
const LABEL_SET = new Set<string>(DETECT_ALLOWED_DISEASES);

const DETECT_VISION_PROMPT = `You are a strict multi-crop plant photo gatekeeper and pathologist for Myanmar farmers.

Supported crops (cropType must be exactly one of these English names when accepted):
${CROP_TYPES.map((c) => `- ${c} / ${cropNameMy(c)}`).join('\n')}

Problems by crop (use ONLY labels listed for the crop you identify):
${cropProblemsPromptBlock()}

STEP 1 — IMAGE GATE (do this FIRST; do not skip):
Decide whether the photo clearly shows plant tissue or pest damage on ONE of the supported crops above:
- ACCEPT: leaf, stem, tiller, sheath, panicle/ear/pod/boll, seedling, fruit/tuber when relevant, or clear insect/pest damage ON a supported crop.
- REJECT if the photo is mainly: wall, building, room, floor, ceiling, window, door, furniture, person, face, hand without a clear plant part, animal, vehicle, road, sky only, screen/UI, food plate, packaging, random object, blurry nothing, or an unsupported ornamental/wild plant with no clear crop match.
- If unsure whether a supported crop is visible → REJECT (do not guess a disease).
- When REJECTING: set quality.ok=false, issues=["not_leaf_like"], cropType="", disease="Healthy", severityIndex=0, confidence=0, probabilities=[{"disease":"Healthy","probability":1}], treatmentProtocol="".
- NEVER invent diseases or pests for walls/buildings/objects.

STEP 2 — DIAGNOSE only if STEP 1 passed (quality.ok=true):
1. Set cropType to the exact English crop name from the supported list.
2. Pick exactly one primary English disease OR pest label from THAT crop's list above (or Healthy).
3. Do not invent labels outside the crop's disease/pest lists. Prefer the closest listed name.

Other fields when accepted:
- severityIndex 0-100 (Healthy near 0)
- probabilities: 2-4 English labels for the SAME crop summing to ~1.0
- treatmentProtocol: 1-2 short practical sentences in Myanmar (Burmese) script
- confidence: 0-1 for top label (use <0.45 if symptoms are weak/unclear)

Return ONLY valid JSON (no markdown fences, no extra text).

Reject example:
{"cropType":"","disease":"Healthy","severityIndex":0,"probabilities":[{"disease":"Healthy","probability":1}],"treatmentProtocol":"","quality":{"ok":false,"issues":["not_leaf_like"]},"confidence":0}

Accept examples:
{"cropType":"Rice","disease":"Blast","severityIndex":72,"probabilities":[{"disease":"Blast","probability":0.82},{"disease":"Brown Spot","probability":0.12}],"treatmentProtocol":"...","quality":{"ok":true,"issues":[]},"confidence":0.82}
{"cropType":"Maize","disease":"Fall Armyworm","severityIndex":65,"probabilities":[{"disease":"Fall Armyworm","probability":0.8},{"disease":"Healthy","probability":0.1}],"treatmentProtocol":"...","quality":{"ok":true,"issues":[]},"confidence":0.8}
{"cropType":"Chili","disease":"Leaf Curl","severityIndex":55,"probabilities":[{"disease":"Leaf Curl","probability":0.7},{"disease":"Thrips","probability":0.2}],"treatmentProtocol":"...","quality":{"ok":true,"issues":[]},"confidence":0.7}`;

type GeminiPart = { text?: string; thought?: boolean };
type GeminiCandidate = {
  finishReason?: string;
  content?: { parts?: GeminiPart[] };
};

/** Prefer non-thought parts — Gemini 3 can burn the whole budget on thinking. */
function extractGeminiText(candidates?: GeminiCandidate[]): {
  text: string;
  finishReason?: string;
} {
  const candidate = candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const answer = parts
    .filter((p) => p?.text && !p.thought)
    .map((p) => p.text || '')
    .join('')
    .trim();
  if (answer) return { text: answer, finishReason: candidate?.finishReason };
  const all = parts
    .map((p) => p.text || '')
    .join('')
    .trim();
  return { text: all, finishReason: candidate?.finishReason };
}

function extractJsonObject(text: string): string | null {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }

  // Truncated JSON — close open braces as a last resort for partial diagnoses
  const partial = cleaned.slice(start);
  if (partial.includes('"disease"')) {
    let repaired = partial.replace(/,\s*$/, '');
    const open = (repaired.match(/{/g) || []).length;
    const close = (repaired.match(/}/g) || []).length;
    repaired += '}'.repeat(Math.max(0, open - close));
    return repaired;
  }
  return null;
}

function parseDetectJson(text: string, modelTag: string): DetectResult {
  const jsonText = extractJsonObject(text);
  if (!jsonText) {
    throw new AppError('Disease detect returned no JSON', 503);
  }
  let parsed: Partial<DetectResult> & {
    quality?: { ok?: boolean; issues?: string[] };
  };
  try {
    parsed = JSON.parse(jsonText) as typeof parsed;
  } catch {
    throw new AppError('Disease detect returned invalid JSON', 503);
  }

  let disease = String(parsed.disease || 'Healthy').trim() || 'Healthy';
  if (!LABEL_SET.has(disease)) {
    const hit = DETECT_ALLOWED_DISEASES.find((d) => d.toLowerCase() === disease.toLowerCase());
    disease = hit || 'Healthy';
  }

  const cropRaw = String(parsed.cropType || '').trim();
  const cropHit = CROP_TYPES.find((c) => c.toLowerCase() === cropRaw.toLowerCase());
  const cropType: DetectResult['cropType'] = cropHit || '';

  const probabilities = Array.isArray(parsed.probabilities)
    ? parsed.probabilities
        .filter((p) => p && typeof p.disease === 'string')
        .map((p) => {
          let name = String(p.disease);
          if (!LABEL_SET.has(name)) {
            const hit = DETECT_ALLOWED_DISEASES.find((d) => d.toLowerCase() === name.toLowerCase());
            name = hit || name;
          }
          return {
            disease: name,
            diseaseMy: diseaseNameMy(name),
            probability: Math.max(0, Math.min(1, Number(p.probability) || 0)),
          };
        })
    : [{ disease, diseaseMy: diseaseNameMy(disease), probability: Number(parsed.confidence) || 0.5 }];

  const issues = Array.isArray(parsed.quality?.issues)
    ? parsed.quality!.issues!.map(String)
    : [];
  const rejectIssue = issues.some((i) =>
    /not_leaf|not_rice|not_plant|not_crop|invalid_image|no_leaf|wall|building/i.test(i)
  );
  let qualityOk = parsed.quality?.ok === true && !rejectIssue && Boolean(cropType);
  if (parsed.quality?.ok === false || rejectIssue) {
    qualityOk = false;
    if (!issues.includes('not_leaf_like')) issues.push('not_leaf_like');
  }
  if (!cropType && disease !== 'Healthy') {
    qualityOk = false;
    if (!issues.includes('not_leaf_like')) issues.push('not_leaf_like');
  }

  const confidence = Math.max(
    0,
    Math.min(1, Number(parsed.confidence) || probabilities[0]?.probability || 0)
  );

  return {
    cropType: qualityOk ? cropType : '',
    disease: qualityOk ? disease : 'Healthy',
    diseaseMy: diseaseNameMy(qualityOk ? disease : 'Healthy'),
    severityIndex: qualityOk ? Math.max(0, Math.min(100, Number(parsed.severityIndex) || 0)) : 0,
    probabilities: qualityOk
      ? probabilities
      : [{ disease: 'Healthy', diseaseMy: diseaseNameMy('Healthy'), probability: 1 }],
    treatmentProtocol: qualityOk
      ? fieldTreatmentMy(disease, cropType) ||
        String(parsed.treatmentProtocol || '').trim() ||
        TREATMENT_MY[disease] ||
        DEFAULT_TREATMENT_MY
      : '',
    quality: { ok: qualityOk, issues: qualityOk ? issues : [...new Set([...issues, 'not_leaf_like'])] },
    confidence: qualityOk ? confidence : 0,
    model: modelTag,
  };
}

function geminiHttpError(raw: { error?: { message?: string; status?: string } }, status: number): never {
  const msg = raw.error?.message || `Gemini error (${status})`;
  if (status === 429 || raw.error?.status === 'RESOURCE_EXHAUSTED') {
    throw new AppError(
      'Gemini free quota exceeded for now. Please wait a minute and try again.',
      503
    );
  }
  throw new AppError(msg, 503);
}

function isGemini3Model(model: string): boolean {
  return /gemini-3/i.test(model);
}

/** Leaf/pest diagnosis via Cursor Agent SDK vision (images on send). */
async function detectWithCursor(
  imageBuffer: Buffer,
  mimeType: string
): Promise<DetectResult> {
  const apiKey = env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError('CURSOR_API_KEY is not configured', 503);
  }

  const safeMime =
    mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/gif'
      ? mimeType
      : 'image/jpeg';

  const { Agent } = await import('@cursor/sdk');
  const timeoutMs = env.CURSOR_DETECT_TIMEOUT_MS;
  const modelId = env.CURSOR_MODEL || 'composer-2.5';
  const imagePayload = [{ data: imageBuffer.toString('base64'), mimeType: safeMime }];

  const rejectResult = (): DetectResult => ({
    cropType: '',
    disease: 'Healthy',
    diseaseMy: diseaseNameMy('Healthy'),
    severityIndex: 0,
    probabilities: [{ disease: 'Healthy', diseaseMy: diseaseNameMy('Healthy'), probability: 1 }],
    treatmentProtocol: '',
    quality: { ok: false, issues: ['not_leaf_like'] },
    confidence: 0,
    model: `cursor:${modelId}`,
  });

  const runDetect = async () => {
    const agent = await Agent.create({
      apiKey,
      model: { id: modelId },
      local: {
        cwd: process.cwd(),
        settingSources: [],
      },
    });

    try {
      // Pass 1: hard gate — is this a supported crop plant at all?
      const gateRun = await agent.send({
        text: [
          'Look at the attached image carefully.',
          'Reply with ONLY this JSON (no markdown):',
          '{"isSupportedCrop":false,"cropGuess":"","what":"short description of what you see"}',
          '',
          `Supported crops: ${CROP_TYPES.join(', ')}.`,
          'Set isSupportedCrop=true ONLY if you clearly see leaf/stem/fruit/pod/boll/tuber/seedling (or pest damage) of one of those crops.',
          'Set isSupportedCrop=false for walls, buildings, rooms, windows, floors, people, hands alone, animals, vehicles, screens, food, packaging, or unsupported plants.',
          'If unsure, set isSupportedCrop=false.',
        ].join('\n'),
        images: imagePayload,
      });
      const gateResult = await gateRun.wait();
      if (gateResult.status === 'error') {
        throw new AppError(
          (gateResult as { error?: { message?: string } }).error?.message || 'Cursor detect failed',
          503
        );
      }
      const gateText = String(gateResult.result || '').trim();
      const gateJson = extractJsonObject(gateText);
      let isSupportedCrop = false;
      if (gateJson) {
        try {
          const gate = JSON.parse(gateJson) as {
            isSupportedCrop?: boolean;
            cropGuess?: string;
            what?: string;
          };
          isSupportedCrop = gate.isSupportedCrop === true;
          console.info('[cursor-detect] gate', {
            isSupportedCrop,
            cropGuess: gate.cropGuess,
            what: gate.what,
            model: modelId,
          });
        } catch {
          isSupportedCrop = false;
        }
      }
      if (!isSupportedCrop) {
        return rejectResult();
      }

      // Pass 2: diagnose only after gate passes
      const run = await agent.send({
        text: [
          DETECT_VISION_PROMPT,
          '',
          'The image passed the supported-crop gate. Identify the crop and diagnose the disease or pest now.',
          'If you realize it is NOT a supported crop after all, return the REJECT JSON.',
          'Return ONLY the JSON object. No markdown fences, no explanation.',
        ].join('\n'),
      });
      const result = await run.wait();

      if (result.status === 'error') {
        throw new AppError(
          (result as { error?: { message?: string } }).error?.message || 'Cursor detect failed',
          503
        );
      }

      const text = String(result.result || '').trim();
      if (!text) {
        throw new AppError('Cursor detect returned an empty reply', 503);
      }

      try {
        return parseDetectJson(text, `cursor:${modelId}`);
      } catch (err) {
        console.warn('[cursor-detect] parse failed', { preview: text.slice(0, 240) });
        throw err;
      }
    } finally {
      agent.close();
    }
  };

  try {
    return await Promise.race([
      runDetect(),
      new Promise<DetectResult>((_, reject) => {
        setTimeout(() => reject(new AppError('Cursor detect timed out', 503)), timeoutMs);
      }),
    ]);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(err instanceof Error ? err.message : 'Cursor detect failed', 503);
  }
}

/** Leaf disease diagnosis via Gemini vision (fallback). */
async function detectWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
  apiKey?: string
): Promise<DetectResult> {
  const key = apiKey?.trim() || geminiApiKeys()[0];
  if (!key) throw new AppError('Gemini API key not configured', 503);

  const safeMime =
    mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/gif'
      ? mimeType
      : 'image/jpeg';

  const model = env.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  // Vision + thinking models need more headroom than chat
  const timeoutMs = Math.max(env.AI_SERVICE_TIMEOUT_MS, 90000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    // Thinking models can consume most of a small budget before emitting JSON
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
  };
  if (isGemini3Model(model)) {
    generationConfig.thinkingConfig = { thinkingLevel: 'minimal' };
  } else if (/gemini-2\.5/i.test(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: DETECT_VISION_PROMPT },
              {
                inline_data: {
                  mime_type: safeMime,
                  data: imageBuffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig,
      }),
    });

    const raw = (await res.json()) as {
      error?: { message?: string; status?: string };
      promptFeedback?: { blockReason?: string };
      candidates?: GeminiCandidate[];
    };

    if (!res.ok) {
      // Some models reject thinkingConfig — retry once without it
      if (
        res.status === 400 &&
        /thinking/i.test(raw.error?.message || '') &&
        generationConfig.thinkingConfig
      ) {
        delete generationConfig.thinkingConfig;
        const retry = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: DETECT_VISION_PROMPT },
                  {
                    inline_data: {
                      mime_type: safeMime,
                      data: imageBuffer.toString('base64'),
                    },
                  },
                ],
              },
            ],
            generationConfig,
          }),
        });
        const retryRaw = (await retry.json()) as typeof raw;
        if (!retry.ok) geminiHttpError(retryRaw, retry.status);
        return parseGeminiDetectResponse(retryRaw, model);
      }
      geminiHttpError(raw, res.status);
    }

    return parseGeminiDetectResponse(raw, model);
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AppError('Gemini detect timed out', 503);
    }
    throw new AppError(err instanceof Error ? err.message : 'Gemini detect failed', 503);
  } finally {
    clearTimeout(timer);
  }
}

function parseGeminiDetectResponse(
  raw: {
    error?: { message?: string; status?: string };
    promptFeedback?: { blockReason?: string };
    candidates?: GeminiCandidate[];
  },
  model: string
): DetectResult {
  if (raw.promptFeedback?.blockReason) {
    throw new AppError(
      `Gemini blocked the image (${raw.promptFeedback.blockReason}). Try another clear leaf photo.`,
      400
    );
  }

  const { text, finishReason } = extractGeminiText(raw.candidates);
  if (!text) {
    console.warn('[gemini-detect] empty reply', {
      finishReason,
      block: raw.promptFeedback?.blockReason,
      parts: raw.candidates?.[0]?.content?.parts?.map((p) => ({
        thought: Boolean(p.thought),
        len: p.text?.length ?? 0,
      })),
    });
    if (finishReason === 'MAX_TOKENS') {
      throw new AppError(
        'Disease detect ran out of tokens before returning JSON. Please try again.',
        503
      );
    }
    if (finishReason === 'SAFETY' || finishReason === 'BLOCKLIST') {
      throw new AppError('Gemini blocked this image. Please try another clear leaf photo.', 400);
    }
    throw new AppError('Gemini detect returned an empty reply', 503);
  }

  try {
    return parseDetectJson(text, `gemini:${model}`);
  } catch (err) {
    console.warn('[gemini-detect] parse failed', {
      finishReason,
      preview: text.slice(0, 240),
    });
    throw err;
  }
}

function isRetryableDetectError(err: unknown): boolean {
  if (!(err instanceof AppError)) return false;
  return (
    isGeminiQuotaError(err) ||
    /no JSON|invalid JSON|empty reply|ran out of tokens|timed out/i.test(err.message)
  );
}

export async function detectDisease(imageBuffer: Buffer, mimeType: string): Promise<DetectResult> {
  // Primary: Gemini vision (rotates KEY → KEY_2 → … → KEY_8 → GEMINI_API_KEYS)
  const keys = geminiApiKeys();
  if (keys.length) {
    let lastError: unknown;
    for (let i = 0; i < keys.length; i += 1) {
      try {
        return await detectWithGemini(imageBuffer, mimeType, keys[i]);
      } catch (err) {
        lastError = err;
        const hasNext = i < keys.length - 1;
        if (hasNext && isRetryableDetectError(err)) {
          console.warn(`[gemini-detect] Key ${i + 1}/${keys.length} failed — trying next key`);
          continue;
        }
        const canFallback = Boolean(env.CURSOR_API_KEY?.trim());
        if (canFallback && isRetryableDetectError(err)) {
          console.warn('[detect] Gemini failed, trying Cursor:', err instanceof Error ? err.message : err);
          break;
        }
        throw err;
      }
    }
    if (!env.CURSOR_API_KEY?.trim()) {
      if (lastError instanceof AppError) throw lastError;
      throw new AppError('Disease detection failed. Please try again.', 503);
    }
  }

  // Fallback: Cursor Agent SDK
  if (env.CURSOR_API_KEY?.trim()) {
    try {
      return await detectWithCursor(imageBuffer, mimeType);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Disease detection failed. Please try again.', 503);
    }
  }

  throw new AppError('Disease detection requires GEMINI_API_KEY', 503);
}

export async function predictRisk(input: {
  cropType?: string;
  disease?: string;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
}): Promise<PredictResult> {
  try {
    const data = await callAi<{ data?: PredictResult } & PredictResult>('/ai/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return (data.data ?? data) as PredictResult;
  } catch {
    if (env.NODE_ENV === 'production') {
      throw new AppError('AI service unavailable', 503);
    }
    return mockPredict(input.humidity);
  }
}

export async function chatWithAi(
  prompt: string,
  history: Array<{ sender: string; text: string }> = [],
  context?: ChatContext
) {
  // Primary: Gemini free tier (rotates KEY → KEY_2 → … → KEY_8)
  if (geminiApiKeys().length) {
    try {
      return await withGeminiKeys((key) => chatWithGemini(prompt, history, context, key));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const canFallback = Boolean(env.CURSOR_API_KEY?.trim()) || env.NODE_ENV !== 'production';
      if (!canFallback) {
        if (err instanceof AppError) throw err;
        throw new AppError('AI chat unavailable', 503);
      }
      console.warn('[chat] Gemini failed, trying fallback:', msg);
    }
  }

  // Optional: Cursor fallback
  if (env.CURSOR_API_KEY?.trim()) {
    try {
      return await chatWithCursor(prompt, history, context);
    } catch (err) {
      if (env.NODE_ENV === 'production') {
        if (err instanceof AppError) throw err;
        throw new AppError('AI chat unavailable', 503);
      }
      console.warn('[chat] Cursor failed, using local mock:', err instanceof Error ? err.message : err);
    }
  }

  try {
    const data = await callAi<{ data?: ChatResult; reply?: string }>('/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        history,
        context: {
          farmerProfile: context?.farmerProfile,
          weatherText: context?.weatherText,
        },
      }),
    });
    return { reply: data.data?.reply ?? data.reply ?? mockChat(prompt).reply };
  } catch {
    if (env.NODE_ENV === 'production') {
      throw new AppError('AI service unavailable', 503);
    }
    const weatherHint = context?.weatherText
      ? ` လက်ရှိရာသီဥတုအချက်အလက်ကို ထည့်သွင်းစဉ်းစားပါ။`
      : '';
    return {
      reply: `${mockChat(prompt).reply}${weatherHint}`,
    };
  }
}

export function treatmentFor(disease: string, crop?: string): string {
  return TREATMENT_MY[disease] || fieldTreatmentMy(disease, crop) || DEFAULT_TREATMENT_MY;
}

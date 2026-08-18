import crypto from 'crypto';
import { ChatbotSession } from '../models/ChatbotSession.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { chatWithAi } from './aiClient.service.js';
import { uploadBuffer } from './storage.service.js';
import { getForecast, reverseGeocode } from './weather.service.js';

const DEFAULT_LAT = 16.8661;
const DEFAULT_LNG = 96.1951;
const DEFAULT_TOWNSHIP = 'Yangon';

const PLACEHOLDER_TOWNSHIPS = new Set([
  '',
  'my farm',
  'my location',
  'selected location',
  'yangon', // ignore guest/default label when GPS coords are present
]);

export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  return ChatbotSession.create({
    userId,
    sessionId,
    messages: [],
    isActive: true,
  });
}

export async function getSession(sessionId: string, userId: string) {
  const session = await ChatbotSession.findOne({ sessionId, userId });
  if (!session) throw new AppError('Session not found', 404);
  return session;
}

export async function history(userId: string) {
  return ChatbotSession.find({ userId }).sort({ updatedAt: -1 }).limit(50);
}

export async function deleteSession(sessionId: string, userId: string) {
  const session = await ChatbotSession.findOneAndDelete({ sessionId, userId });
  if (!session) throw new AppError('Session not found', 404);
  return { deleted: true, sessionId };
}

export async function clearHistory(userId: string) {
  const result = await ChatbotSession.deleteMany({ userId });
  return { deleted: true, count: result.deletedCount || 0 };
}

type ChatLocation = {
  lat?: number;
  lng?: number;
  township?: string;
};

function formatWeatherContext(input: {
  township: string;
  region?: string;
  lat: number;
  lng: number;
  source: string;
  summary: Awaited<ReturnType<typeof getForecast>>['summary'];
  daily: Awaited<ReturnType<typeof getForecast>>['daily'];
  alerts: Awaited<ReturnType<typeof getForecast>>['alerts'];
  recommendations: Awaited<ReturnType<typeof getForecast>>['recommendations'];
}): string {
  const s = input.summary;
  const nextDays = (input.daily || [])
    .slice(0, 3)
    .map(
      (d) =>
        `${d.date}: high ${d.high ?? '—'}°C / low ${d.low ?? '—'}°C, rain ${d.rainSum ?? 0} mm (~${d.rainChance ?? 0}%)`
    )
    .join('; ');

  const alertLines = (input.alerts || [])
    .slice(0, 3)
    .map((a) => `[${a.level}] ${a.title}: ${a.message}`)
    .join(' | ');

  const riceTips = (input.recommendations?.rice || [])
    .slice(0, 3)
    .map((t) => t.text)
    .join(' ');

  return [
    `Location: ${input.township}${input.region ? `, ${input.region}` : ''} (Myanmar)`,
    `Coordinates: ${input.lat.toFixed(4)}, ${input.lng.toFixed(4)} (source: ${input.source})`,
    `Now: temp ${s.temperature ?? '—'}°C (feels ${s.feelsLike ?? '—'}°C), humidity ${s.humidity ?? '—'}% (${s.humidityLabel || 'n/a'}), rain chance today ~${s.rainChance ?? 0}%, rain today ${s.rain24h ?? 0} mm, wind ${s.windSpeed ?? '—'} km/h ${s.windDirection || ''} (${s.windLabel || 'n/a'}), UV ${s.uvIndex ?? '—'} (${s.uvLabel || 'n/a'})`,
    nextDays ? `Next days: ${nextDays}` : '',
    alertLines ? `Alerts: ${alertLines}` : 'Alerts: none currently flagged',
    riceTips ? `Rice tips: ${riceTips}` : '',
    'Important: Use THIS location and these weather numbers. Do not assume Yangon unless coordinates/source say Yangon.',
  ]
    .filter(Boolean)
    .join('\n');
}

function inMyanmar(lat: number, lng: number) {
  return lat >= 9.5 && lat <= 28.6 && lng >= 92.1 && lng <= 101.3;
}

function isPlaceholderTownship(name?: string) {
  return !name || PLACEHOLDER_TOWNSHIPS.has(name.trim().toLowerCase());
}

async function resolveChatContext(userId: string, loc: ChatLocation = {}) {
  const user = await User.findById(userId).select('fullName crops location isGuest');
  const coords = user?.location?.coordinates?.coordinates;
  const hasProfileCoords =
    Array.isArray(coords) &&
    coords.length >= 2 &&
    Number.isFinite(coords[0]) &&
    Number.isFinite(coords[1]) &&
    !(coords[0] === 0 && coords[1] === 0) &&
    inMyanmar(Number(coords[1]), Number(coords[0]));

  const hasClientCoords =
    typeof loc.lat === 'number' &&
    typeof loc.lng === 'number' &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng) &&
    inMyanmar(loc.lat, loc.lng);

  let lat = DEFAULT_LAT;
  let lng = DEFAULT_LNG;
  let township = DEFAULT_TOWNSHIP;
  let region = 'Myanmar';
  let source = 'default-yangon';

  if (hasClientCoords) {
    lat = loc.lat!;
    lng = loc.lng!;
    source = 'device-gps';
    const place = await reverseGeocode(lat, lng);
    if (place) {
      township = place.nameEn || place.name;
      region = place.region || 'Myanmar';
      source = 'device-gps+reverse-geocode';
    } else if (!isPlaceholderTownship(loc.township)) {
      township = loc.township!.trim();
      region = user?.location?.region?.trim() || 'Myanmar';
    } else if (user?.location?.township?.trim() && !isPlaceholderTownship(user.location.township)) {
      township = user.location.township.trim();
      region = user.location.region?.trim() || 'Myanmar';
    } else {
      township = `Farm near ${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      region = 'Myanmar';
    }
  } else if (loc.township?.trim() && !isPlaceholderTownship(loc.township)) {
    township = loc.township.trim();
    region = user?.location?.region?.trim() || 'Myanmar';
    source = 'client-name';
  } else if (hasProfileCoords) {
    lng = coords![0];
    lat = coords![1];
    source = 'profile';
    township = user?.location?.township?.trim() || DEFAULT_TOWNSHIP;
    region = user?.location?.region?.trim() || 'Myanmar';
    if (isPlaceholderTownship(township) || township.toLowerCase() === 'yangon') {
      const place = await reverseGeocode(lat, lng);
      if (place) {
        township = place.nameEn || place.name;
        region = place.region || region;
        source = 'profile+reverse-geocode';
      }
    }
  } else if (user?.location?.township?.trim() && !isPlaceholderTownship(user.location.township)) {
    // Name only — still used for messaging; weather stays Yangon default coords unless known
    township = user.location.township.trim();
    region = user.location.region?.trim() || 'Myanmar';
    source = 'profile-name-only';
  }

  // Persist resolved GPS onto the user so later chats don't fall back to Yangon
  if (hasClientCoords && user && lat >= 9.5 && lat <= 28.6 && lng >= 92.1 && lng <= 101.3) {
    try {
      user.location = {
        township,
        region,
        coordinates: { type: 'Point', coordinates: [lng, lat] },
      };
      await user.save();
    } catch {
      /* non-fatal */
    }
  }

  const crops =
    Array.isArray(user?.crops) && user!.crops.length
      ? user!.crops.join(', ')
      : 'Rice';

  const farmerProfile = [
    `Farmer: ${user?.fullName || (user?.isGuest ? 'Guest Farmer' : 'Farmer')}`,
    user?.isGuest ? 'Account: guest (encourage creating a real account for saved history)' : '',
    `Crops: ${crops}`,
    `Farm location: ${township}${region ? `, ${region}` : ''} (${lat.toFixed(4)}, ${lng.toFixed(4)}; ${source})`,
  ]
    .filter(Boolean)
    .join('\n');

  let weatherText = '';
  try {
    const forecast = await getForecast(lat, lng);
    weatherText = formatWeatherContext({
      township,
      region,
      lat,
      lng,
      source,
      summary: forecast.summary,
      daily: forecast.daily,
      alerts: forecast.alerts,
      recommendations: forecast.recommendations,
    });
  } catch {
    weatherText = `Location: ${township} (${lat.toFixed(4)}, ${lng.toFixed(4)}; ${source}). Live weather unavailable. Give general Myanmar-season advice.`;
  }

  return { farmerProfile, weatherText, township };
}

export async function sendMessage(
  userId: string,
  text: string,
  options: { sessionId?: string; files?: Express.Multer.File[] } & ChatLocation = {}
) {
  const { sessionId, lat, lng, township, files = [] } = options;
  const trimmed = String(text || '').trim();
  if (!trimmed && !files.length) {
    throw new AppError('Please type a question or attach a photo', 400);
  }

  let session = sessionId
    ? await ChatbotSession.findOne({ sessionId, userId })
    : null;

  if (!session) {
    session = await createSession(userId);
  }

  const imageFiles = files.filter((f) => f.mimetype.startsWith('image/'));
  const otherFiles = files.filter((f) => !f.mimetype.startsWith('image/'));
  const imageUrls: string[] = [];
  const attachments: Array<{ url: string; name: string; mimeType: string }> = [];

  for (const file of imageFiles) {
    const url = await uploadBuffer(file.buffer, file.originalname || 'photo.jpg', file.mimetype);
    imageUrls.push(url);
  }
  for (const file of otherFiles) {
    const url = await uploadBuffer(file.buffer, file.originalname || 'file', file.mimetype);
    attachments.push({ url, name: file.originalname || 'file', mimeType: file.mimetype });
  }

  const storedText =
    trimmed ||
    (imageUrls.length ? 'Please look at the attached crop photo(s) and advise.' : 'Please review the attached file.');

  session.messages.push({
    sender: 'user',
    text: storedText,
    audioUrl: '',
    imageUrls,
    attachments,
    timestamp: new Date(),
  });

  if (session.messages.length > 80) {
    session.messages.splice(0, session.messages.length - 80);
  }

  const historyMsgs = session.messages.slice(-10).map((m) => ({
    sender: m.sender,
    text: m.text,
  }));

  const { farmerProfile, weatherText } = await resolveChatContext(userId, {
    lat,
    lng,
    township,
  });

  let prompt = storedText;
  if (imageUrls.length) {
    prompt += `\n\nThe farmer attached ${imageUrls.length} photo(s) of their crop or field. Look at the image(s) and give practical Myanmar farming advice.`;
  }
  if (attachments.length) {
    prompt += `\n\nAttached files: ${attachments.map((a) => a.name).join(', ')}. Use the filenames as context if you cannot open the file.`;
  }

  const { reply } = await chatWithAi(prompt, historyMsgs, {
    farmerProfile,
    weatherText,
    images: imageFiles.map((f) => ({
      mimeType: f.mimetype,
      base64: f.buffer.toString('base64'),
    })),
  });

  session.messages.push({
    sender: 'bot',
    text: reply,
    audioUrl: '',
    imageUrls: [],
    attachments: [],
    timestamp: new Date(),
  });

  await session.save();
  return { sessionId: session.sessionId, reply, session };
}

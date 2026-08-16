import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRE: z.string().default('30m'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),
  MONGODB_URI: z.string().min(1),
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Smart Agro Community <noreply@smartagro.local>'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().default(15000),
  /** Gemini API keys — primary for leaf detect + farmer chatbot (free tier). Rotates on quota. */
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY_2: z.string().optional().default(''),
  GEMINI_API_KEY_3: z.string().optional().default(''),
  GEMINI_API_KEY_4: z.string().optional().default(''),
  GEMINI_API_KEY_5: z.string().optional().default(''),
  GEMINI_API_KEY_6: z.string().optional().default(''),
  GEMINI_API_KEY_7: z.string().optional().default(''),
  GEMINI_API_KEY_8: z.string().optional().default(''),
  /** Optional comma-separated extra Gemini keys (after KEY … KEY_8). */
  GEMINI_API_KEYS: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
  /** Primary AI for leaf detect + farmer chat. Flip to `cursor` on project day. */
  AI_PROVIDER: z.enum(['gemini', 'cursor']).default('gemini'),
  /** Cursor SDK key — used when AI_PROVIDER=cursor, or as Gemini fallback. */
  CURSOR_API_KEY: z.string().optional().default(''),
  CURSOR_MODEL: z.string().default('composer-2.5'),
  CURSOR_DETECT_TIMEOUT_MS: z.coerce.number().default(120000),
  WEATHER_API_URL: z.string().default('https://api.open-meteo.com/v1'),
  WEATHER_CACHE_TTL_SECONDS: z.coerce.number().default(900),
  FILE_STORAGE_TYPE: z.enum(['gridfs', 's3']).default('gridfs'),
  RATE_LIMIT_MAX_PER_MINUTE: z.coerce.number().default(100),
  OTP_TTL_SECONDS: z.coerce.number().default(180),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  OTP_DEV_LOG: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  /** Fixed OTP for local testing (ignored in production). Default 112233. */
  DEV_OTP: z.string().regex(/^\d{6}$/).default('112233'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

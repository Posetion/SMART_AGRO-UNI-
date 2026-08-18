import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { mockOpenMeteoPayload } from './helpers.js';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_agro_test_placeholder';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_1234567890';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_1234567890';
process.env.JWT_ACCESS_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';
process.env.OTP_DEV_LOG = 'true';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_MAX_PER_MINUTE = '1000';
process.env.OTP_TTL_SECONDS = '180';
process.env.OTP_MAX_ATTEMPTS = '3';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '0';
process.env.AI_SERVICE_URL = 'http://localhost:8000';
process.env.AI_PROVIDER = 'local';
process.env.WEATHER_API_URL = 'https://api.open-meteo.com/v1';
process.env.WEATHER_CACHE_TTL_SECONDS = '900';
process.env.FILE_STORAGE_TYPE = 'gridfs';
process.env.EMAIL_HOST = 'smtp.example.com';
process.env.EMAIL_PORT = '587';
process.env.PORT = '5000';

let mongo: MongoMemoryServer | undefined;
const originalFetch = globalThis.fetch;

beforeAll(async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (/open-meteo|api\.open-meteo/i.test(url) || url.includes('/forecast?latitude')) {
      return new Response(JSON.stringify(mockOpenMeteoPayload()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (typeof originalFetch === 'function') {
      return originalFetch(input, init);
    }
    return new Response(JSON.stringify({ error: 'blocked in tests' }), { status: 503 });
  }) as typeof fetch;

  const localUri = 'mongodb://127.0.0.1:27017/smart_agro_vitest';
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    process.env.MONGODB_URI = localUri;
  } catch {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    await mongoose.connect(process.env.MONGODB_URI);
  }
}, 600000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  globalThis.fetch = originalFetch;
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongo) await mongo.stop();
});

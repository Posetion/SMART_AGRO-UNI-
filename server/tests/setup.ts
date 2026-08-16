import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

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
process.env.WEATHER_API_URL = 'https://api.open-meteo.com/v1';
process.env.WEATHER_CACHE_TTL_SECONDS = '900';
process.env.FILE_STORAGE_TYPE = 'gridfs';
process.env.EMAIL_HOST = 'smtp.example.com';
process.env.EMAIL_PORT = '587';
process.env.PORT = '5000';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
}, 120000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
